import type { FC } from "react";

import type { LessonRuntimeType } from "../types/content";
import type { SandboxFrameHandle } from "../sandbox/SandboxFrame";
import type { SandboxProblem } from "../sandbox/useSandbox";

/**
 * Права панель отримує **вікно пісочниці**, а не документ: сторінку учня складає
 * `sandbox/composePage` і вантажить її як `srcdoc`. Панелі лишається оформлення:
 * хром браузера, консоль або нічого.
 */
export type RuntimePreviewProps = {
  frame: SandboxFrameHandle;
  /** Помилки виконання й `console.warn`/`error` з коду учня. */
  problems: SandboxProblem[];
};

/**
 * Розетка для типу уроку. HTML/CSS — одна вилка, JS буде другою, React третьою.
 *
 * Сторінка уроку не знає, що саме встромлене: вона бере runtime за `lesson.runtimeType`
 * і рендерить. Додати новий тип уроку = додати сюди запис, сторінку не чіпати.
 */
export type LessonRuntime = {
  id: LessonRuntimeType;
  /** Чи потрібен редактор коду. */
  hasEditor: boolean;
  /** Чи проходиться з телефона — див. «Мобільний режим» у PLATFORM_UA. */
  mobileSupported: boolean;
  /** Вікно браузера, консоль або нічого — у уроків без коду. */
  Preview: FC<RuntimePreviewProps> | null;
};

export type LessonRuntimeRegistry = Partial<Record<LessonRuntimeType, LessonRuntime>>;
