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
import type {
  ConsoleLevel,
  RunnerEvent,
  RunnerRequest,
  TaskResult,
} from "../domain/runner";

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
 * Перевірка йде по **живому** DOM — тому вона й живе тут, а не на сторінці.
 * Питання техчека сюди не доїжджають: їх відфільтровує викликач, бо відповідь
 * на них не в документі.
 */
const runCheck = (checkId: string, tasks: { id: string; rules: RunnerCheckRules }[]) => {
  if (cancelled.has(checkId)) {
    send({ type: "timeout", checkId });
    return;
  }

  const results: TaskResult[] = tasks.map((task) => {
    const check = checkTask(document, task.rules);
    return { taskId: task.id, passed: check.passed, rules: check.rules };
  });

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
      runCheck(request.checkId, request.tasks);
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
