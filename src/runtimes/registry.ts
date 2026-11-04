import Output from "../components/CodeEditor/Output";
import type { LessonRuntimeType } from "../types/content";
import type { LessonRuntime, LessonRuntimeRegistry } from "./types";

/**
 * Вікно браузера навколо пісочниці.
 *
 * Тут більше немає `buildDocument`: entry-файл уроку — **цілий** документ,
 * і рушій не додає до нього нічого від себе (PLATFORM_UA, розділ 5, «Формат
 * документа уроку»). Складання сторінки з файлів переїхало **на сторінку-батька**
 * — `sandbox/composeDocument`, функція `composePage`; агентові лишилась перевірка.
 */
const htmlCssPreview: LessonRuntime = {
  id: "html-css-preview",
  hasEditor: true,
  mobileSupported: false,
  Preview: Output,
};

/**
 * Друга реалізація — та, що доводить реєстр. Вона ж показує, де його межа.
 *
 * `Preview` тут **той самий** `Output`, і це не недогляд: сторінка, яку оживляє
 * JS, лишається сторінкою, тож вікно браузера для неї правильне. Різниця
 * між типами уроку їде не сюди, а в `composePage` — `js-dom` потребує підстановки
 * `<script src>`, якої `html-css-preview` не бачить.
 *
 * Чесна ціна цього вибору: спільний `Preview` доводить реєстр слабше, ніж довів
 * би `code-output` зі своєю окремою панеллю. `code-output` і буде тим, хто
 * перевірить слот по-справжньому.
 */
const jsDom: LessonRuntime = {
  id: "js-dom",
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
 * Свідомо без заглушок для `code-output` і майбутнього SPA: порожній запис
 * виглядав би як підтримка, якої немає. Зʼявляться разом зі справжніми
 * реалізаціями — так, як щойно зʼявився `js-dom`.
 */
export const lessonRuntimes: LessonRuntimeRegistry = {
  "html-css-preview": htmlCssPreview,
  "js-dom": jsDom,
  "theory-only": theoryOnly,
  video,
};

export const getLessonRuntime = (type: LessonRuntimeType): LessonRuntime | null =>
  lessonRuntimes[type] ?? null;
