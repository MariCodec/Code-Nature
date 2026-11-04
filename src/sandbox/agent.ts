/**
 * Агент пісочниці: єдиний код застосунку, який живе поруч із кодом учня.
 *
 * Виконується в `<iframe sandbox="allow-scripts">` без `allow-same-origin`, тобто
 * на **окремому, непрозорому** origin. Наслідок і є метою: сторінка не може
 * зазирнути сюди через `contentDocument`, а `<script>` в уроці не може дістати
 * `parent.localStorage`, де лежить токен сесії.
 *
 * Звідси й форма роботи: назовні їдуть **повідомлення**, а не значення.
 *
 * Агент — перший елемент `<head>` сторінки учня, і свій `<script>` він одразу
 * прибирає з DOM. Тому перевірка бачить рівно те, що написав учень: жодного
 * зайвого тега, жодної обгортки.
 *
 * Валідатор імпортується з домену **незміненим** — він і писався так, щоб не знати,
 * звідки взявся `Document` (PLATFORM_UA, розділ 5). Другої копії перевірки немає
 * навмисно: дві копії розійшлися б, і обидві лишались би зеленими.
 *
 * Збирається в рядок плагіном `vite/sandboxAgent.ts`: завантажити скрипт із нашого
 * домену пісочниця не може за визначенням, тож єдиний шлях — інлайном.
 */

import { checkTask } from "../domain/taskValidation";
import { performActions } from "./actions";
import type {
  ConsoleLevel,
  RunnerEvent,
  RunnerRequest,
  TaskResult,
} from "../domain/runner";

/** Причина невдалої дії → ключ, з якого інтерфейс складе речення учневі. */
const ACT_FAILURE_KEY = {
  missing: "actTargetMissing",
  notTypeable: "actTargetNotTypeable",
  notClickable: "actTargetNotClickable",
} as const;

/** Правила завдання в тому вигляді, в якому вони приїжджають у `check`. */
type RunnerCheckRules = Extract<RunnerRequest, { type: "check" }>["tasks"][number]["rules"];

/**
 * Скільки повідомлень консолі пересилаємо за один запуск.
 *
 * Мільйон повідомлень кладе батька не гірше за нескінченний цикл, а `console.log`
 * у циклі — це не зловмисник, це звичайна помилка учня.
 */
const CONSOLE_LIMIT = 200;

let consoleSent = 0;
/** Перевірки, від яких сторінка вже відмовилась: відповідати на них не можна. */
const cancelled = new Set<string>();

const send = (event: RunnerEvent) => {
  // Цільовий origin лишається `*`: у сторінки-батька він свій, а домовитись
  // про нього неможливо — ми самі на непрозорому origin і його не знаємо.
  window.parent.postMessage(event, "*");
};

/**
 * Аргументи консолі їдуть рядками: через `postMessage` проходить лише те,
 * що клонується, а в консоль учня прилітають і функції, і DOM-вузли, і цикли.
 */
const stringify = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value instanceof Error) return `${value.name}: ${value.message}`;

  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};

const patchConsole = () => {
  const levels: ConsoleLevel[] = ["log", "warn", "error"];

  for (const level of levels) {
    const original = console[level].bind(console);

    console[level] = (...args: unknown[]) => {
      original(...args);
      if (consoleSent >= CONSOLE_LIMIT) return;

      consoleSent += 1;
      send({ type: "console", level, args: args.map(stringify) });
    };
  }
};

const onError = (event: ErrorEvent) => {
  send({
    type: "runtime-error",
    message: event.message,
    stack: event.error instanceof Error ? event.error.stack : undefined,
  });
};

const onRejection = (event: PromiseRejectionEvent) => {
  const reason: unknown = event.reason;
  send({
    type: "runtime-error",
    message: reason instanceof Error ? reason.message : stringify(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
};

/**
 * Дочекатись наслідків дії перед тим, як дивитись на DOM.
 *
 * `setTimeout(0)`, а **не** `requestAnimationFrame`, і це виміряно, а не вибрано
 * за смаком. Кадр планується лише тоді, коли сторінку справді малюють: у вкладці
 * у фоні, у згорнутому вікні чи в панелі, яка не композитить iframe, `rAF`
 * не спрацьовує **ніколи** — агент мовчить, сторінка чекає пʼять секунд
 * і каже «перевірка не завершилась». Спіймано саме так: `result` не приходив,
 * хоча `ready` приходив і дія виконувалась.
 *
 * Правило загальніше за цей випадок: **перевірка не має залежати від того,
 * чи сторінку видно.** Таймер цієї залежності не має, а відмальовка нам і
 * не потрібна — `textContent` міняється синхронно, і прочитати його можна
 * до першого кадру.
 *
 * Межа названа чесно: `setTimeout` усередині обробника учня сюди не влізе —
 * перевірка побачить сторінку до спрацювання його таймера. **Тригер**
 * повернутись — урок, який вчить саме відкладені дії.
 */
const settled = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/**
 * Перевірка йде по **живому** DOM — тому вона й живе тут, а не на сторінці.
 * Питання техчека сюди не доїжджають: їх відфільтровує викликач, бо відповідь
 * на них не в документі.
 *
 * Дії (`rules.act`) виконуються **перед** поглядом, і саме тут, а не на сторінці:
 * ззовні документ пісочниці недоступний за визначенням. Валідатор від цього
 * лишається чистим — до його виклику дії вже сталися.
 *
 * Сторінка надсилає завдання **по одному**, кожне в своєму вікні: дія змінює
 * документ, і перевіряти наступне завдання в залишеному стані означало б
 * зробити порядок завдань значущим.
 */
const runCheck = async (
  checkId: string,
  tasks: { id: string; rules: RunnerCheckRules }[],
) => {
  if (cancelled.has(checkId)) {
    send({ type: "timeout", checkId });
    return;
  }

  const results: TaskResult[] = [];

  for (const task of tasks) {
    const act = task.rules.kind === "dom" ? task.rules.act : undefined;

    if (act?.length) {
      const failure = performActions(document, act);
      if (failure) {
        results.push({
          taskId: task.id,
          passed: false,
          rules: [
            {
              passed: false,
              failure: { key: ACT_FAILURE_KEY[failure.reason], selector: failure.selector },
            },
          ],
        });
        continue;
      }
      await settled();
    }

    const check = checkTask(document, task.rules);
    results.push({ taskId: task.id, passed: check.passed, rules: check.rules });
  }

  // Сторінка могла передумати, поки ми чекали кадр.
  if (cancelled.has(checkId)) return;

  send({ type: "result", checkId, results });
};

/**
 * Відправника перевіряємо навіть тут: посилання на це вікно має лише батько,
 * але «має лише батько» — це висновок, а `event.source !== window.parent` — перевірка.
 */
const onMessage = (event: MessageEvent<RunnerRequest>) => {
  if (event.source !== window.parent) return;

  const request = event.data;
  if (!request || typeof request !== "object") return;

  switch (request.type) {
    case "check":
      void runCheck(request.checkId, request.tasks);
      return;
    case "cancel":
      cancelled.add(request.checkId);
      send({ type: "timeout", checkId: request.checkId });
      return;
  }
};

// Свій слід у сторінці учня прибираємо одразу: код уже виконується, а в DOM,
// який побачить перевірка, нашого тега бути не має.
document.currentScript?.remove();

patchConsole();
window.addEventListener("message", onMessage);
window.addEventListener("error", onError);
window.addEventListener("unhandledrejection", onRejection);

/**
 * `ready` — коли сторінка учня розібрана до кінця. Раніше не можна: перевірка
 * прийшла б по недобудованому DOM і не знайшла б того, що учень написав нижче
 * за наш скрипт.
 */
if (document.readyState === "complete") send({ type: "ready" });
else window.addEventListener("load", () => send({ type: "ready" }), { once: true });
