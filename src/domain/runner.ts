/**
 * Контракт пісочниці: перелік дозволених повідомлень між сторінкою і кодом учня.
 *
 * Чому повідомлення, а не прямий доступ до iframe:
 *  1. JS учня спрацьовує пізніше — по кліку, по таймеру. «Зазирнути одразу» нікуди;
 *  2. правильно замкнена пісочниця (`sandbox="allow-scripts"` без `allow-same-origin`)
 *     ззовні недоступна за визначенням — і це те, чого ми хочемо: інакше `<script>`
 *     в уроці читає токен сесії учня.
 *
 * Тут лише форма розмови. Виконання приїде у Фазі 3.
 */

import type { RuleResult } from "./taskValidation";
import type { TaskRules } from "../types/lessonTypes";

export type RunnerFile = {
  name: string;
  language: string;
  content: string;
};

/**
 * Результат по кожному правилу, а не один булеан: учневі треба знати, **яке саме**
 * не зійшлося. Рядка тут немає — правила повертають ключі, текст складає інтерфейс
 * із `i18n`, тож через `postMessage` їде структура, а не українське речення.
 */
export type TaskResult = {
  taskId: string;
  passed: boolean;
  rules: RuleResult[];
};

export type ConsoleLevel = "log" | "warn" | "error";

/** Сторінка → пісочниця. */
export type RunnerRequest =
  | { type: "run"; files: RunnerFile[] }
  | {
      type: "check";
      /** Звʼязує відповідь із запитом: перевірок може бути кілька поспіль. */
      checkId: string;
      tasks: { id: string; rules: TaskRules }[];
    };

/** Пісочниця → сторінка. */
export type RunnerEvent =
  | { type: "ready" }
  | { type: "console"; level: ConsoleLevel; args: string[] }
  | { type: "runtime-error"; message: string; stack?: string }
  | { type: "result"; checkId: string; results: TaskResult[] };

const EVENT_TYPES = new Set(["ready", "console", "runtime-error", "result"]);

/**
 * Повідомлення приходить через `postMessage` — тобто ззовні, і довіряти його формі не можна.
 * Стороннє вікно теж може надіслати щось у наш обробник, тож усе неочікуване відкидаємо.
 */
export function isRunnerEvent(value: unknown): value is RunnerEvent {
  if (!value || typeof value !== "object") return false;

  const type = (value as { type?: unknown }).type;
  return typeof type === "string" && EVENT_TYPES.has(type);
}
