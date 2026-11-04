/**
 * Контракт пісочниці: перелік дозволених повідомлень між сторінкою і кодом учня.
 *
 * Чому повідомлення, а не прямий доступ до iframe:
 *  1. JS учня спрацьовує пізніше — по кліку, по таймеру. «Зазирнути одразу» нікуди;
 *  2. правильно замкнена пісочниця (`sandbox="allow-scripts"` без `allow-same-origin`)
 *     ззовні недоступна за визначенням — і це те, чого ми хочемо: інакше `<script>`
 *     в уроці читає токен сесії учня.
 */

import type { RuleResult } from "./taskValidation";
import type { TaskRules } from "../types/lessonTypes";

export type RunnerFile = {
  name: string;
  language: string;
  content: string;
  /**
   * Який файл вантажиться першим. Без цього неможливий ні `<script src>`
   * у Фазі 4, ні урок із двох сторінок, а припускати імʼя `index.html`
   * не можна — вкладки будуються з `files[]`, хай як вони звуться.
   */
  isEntry: boolean;
};

/**
 * Результат по кожному правилу, а не один булеан: учневі треба знати, **яке саме**
 * не зійшлося. Рядка тут немає — правила повертають ключі, текст складає інтерфейс
 * із `i18n`, тож через `postMessage` їде структура, а не українське речення.
 */
/**
 * Ассет уроку — **посилання**, а не файл. `lesson_files.initial_content` це рядок,
 * тож бінарник туди не лягає, а `data:` URI в контенті означав би, що картинка
 * на 50 КБ парситься з JSON на кожне відкриття уроку (PLATFORM_UA, розділ 5).
 */
export type RunnerAsset = { name: string; url: string };

export type TaskResult = {
  taskId: string;
  passed: boolean;
  rules: RuleResult[];
};

export type ConsoleLevel = "log" | "warn" | "error";

/**
 * Сторінка → пісочниця.
 *
 * Запуску тут немає, і це рішення, а не пропуск: сторінка учня **вантажиться
 * пісочницею як `srcdoc`**, а не надсилається їй повідомленням. Причина
 * виміряна в браузері — `document.write` у вже відкритий документ лишає кадр
 * незамальованим, див. `sandbox/composePage`. Побічний виграш: кожен запуск
 * дістає нове вікно, тож чужі таймери не переживають Run.
 */
export type RunnerRequest =
  | {
      type: "check";
      /** Звʼязує відповідь із запитом: перевірок може бути кілька поспіль. */
      checkId: string;
      tasks: { id: string; rules: TaskRules }[];
    }
  /**
   * Відмова від перевірки, на яку вже не чекаємо. Пісочниця, якщо ще жива,
   * відповідає `timeout` із тим самим `checkId` і не надсилає `result`.
   */
  | { type: "cancel"; checkId: string };

/** Пісочниця → сторінка. */
export type RunnerEvent =
  | { type: "ready" }
  | { type: "console"; level: ConsoleLevel; args: string[] }
  | { type: "runtime-error"; message: string; stack?: string }
  | { type: "result"; checkId: string; results: TaskResult[] }
  /**
   * Перевірка не буде завершена. Другу половину режиму відмови тримає сторінка:
   * код учня може зациклитись до того, як агент устигне сюди дійти, і тоді
   * `timeout` не прийде ніколи — сторінка міряє власний дедлайн і перестворює iframe.
   */
  | { type: "timeout"; checkId: string };

const CONSOLE_LEVELS = new Set<string>(["log", "warn", "error"]);

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

/**
 * Правило одне: `passed: true` — і більше нічого; `passed: false` — і тоді
 * обовʼязково `failure` з ключем. Читач одразу звужує тип на `passed`, тож
 * `{ passed: false }` без `failure` кинув би саме там, де ми складаємо текст учневі.
 */
const isRuleResult = (value: unknown): value is RuleResult => {
  if (!isObject(value)) return false;
  if (value.passed === true) return true;
  if (value.passed !== false) return false;

  return isObject(value.failure) && typeof value.failure.key === "string";
};

const isTaskResult = (value: unknown): value is TaskResult =>
  isObject(value) &&
  typeof value.taskId === "string" &&
  typeof value.passed === "boolean" &&
  Array.isArray(value.rules) &&
  value.rules.every(isRuleResult);

/**
 * Повідомлення приходить через `postMessage`, тобто ззовні, і форму його
 * перевіряємо **повністю**, а не по тегу.
 *
 * Причина не лише в сторонніх вікнах. Пісочниця **не є довіреним співрозмовником**:
 * вона за задумом виконує код учня, і той може надіслати підроблений `result`
 * будь-якої форми. Від шахрайства це не рятує — клієнтська перевірка підробна
 * в принципі (PLATFORM_UA, розділ 8), — але не дає сміттю зламати застосунок
 * там, де ми вже звузили тип і читаємо поля.
 */
export function isRunnerEvent(value: unknown): value is RunnerEvent {
  if (!isObject(value)) return false;

  switch (value.type) {
    case "ready":
      return true;
    case "console":
      return typeof value.level === "string" &&
        CONSOLE_LEVELS.has(value.level) &&
        isStringArray(value.args);
    case "runtime-error":
      return (
        typeof value.message === "string" &&
        (value.stack === undefined || typeof value.stack === "string")
      );
    case "result":
      return (
        typeof value.checkId === "string" &&
        Array.isArray(value.results) &&
        value.results.every(isTaskResult)
      );
    case "timeout":
      return typeof value.checkId === "string";
    default:
      return false;
  }
}
