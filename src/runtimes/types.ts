import type { FC } from "react";

import type { RunnerFile, TaskResult } from "../domain/runner";
import type { LessonRuntimeType } from "../types/content";

export type RuntimePreviewProps = {
  files: RunnerFile[];
  results: TaskResult[];
  isRunning: boolean;
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
  /** Що саме завантажується в пісочницю. Немає в уроків без коду. */
  buildDocument?: (files: RunnerFile[]) => string;
  /** Права панель: вікно браузера, консоль або нічого. Зʼявиться у Фазі 3. */
  Preview: FC<RuntimePreviewProps> | null;
};

export type LessonRuntimeRegistry = Partial<Record<LessonRuntimeType, LessonRuntime>>;
