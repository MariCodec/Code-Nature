import Output from "../components/CodeEditor/Output";
import type { LessonRuntimeType } from "../types/content";
import type { LessonRuntime, LessonRuntimeRegistry } from "./types";

/**
 * Вікно браузера навколо пісочниці.
 *
 * Тут більше немає `buildDocument`: entry-файл уроку — **цілий** документ,
 * і рушій не додає до нього нічого від себе (PLATFORM_UA, розділ 5, «Формат
 * документа уроку»). Складання сторінки з файлів переїхало до агента, бо
 * підстановка сусіднього `<link rel="stylesheet">` можлива лише там, де є DOM.
 */
const htmlCssPreview: LessonRuntime = {
  id: "html-css-preview",
  hasEditor: true,
  mobileSupported: false,
  Preview: Output,
};

const theoryOnly: LessonRuntime = {
  id: "theory-only",
  hasEditor: false,
  mobileSupported: true,
  Preview: null,
};

const video: LessonRuntime = {
  id: "video",
  hasEditor: false,
  mobileSupported: true,
  Preview: null,
};

/**
 * Свідомо без заглушок для `js-dom`, `code-output` і майбутнього SPA:
 * порожній запис виглядав би як підтримка, якої немає. Зʼявляться у Фазі 4
 * разом зі справжніми реалізаціями.
 */
export const lessonRuntimes: LessonRuntimeRegistry = {
  "html-css-preview": htmlCssPreview,
  "theory-only": theoryOnly,
  video,
};

export const getLessonRuntime = (type: LessonRuntimeType): LessonRuntime | null =>
  lessonRuntimes[type] ?? null;
