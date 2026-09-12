import type { RunnerFile } from "../domain/runner";
import type { LessonRuntimeType } from "../types/content";
import type { LessonRuntime, LessonRuntimeRegistry } from "./types";

const joinByLanguage = (files: RunnerFile[], language: string) =>
  files
    .filter((file) => file.language === language)
    .map((file) => file.content)
    .join("\n");

/**
 * Вміст пісочниці для HTML/CSS-уроку.
 *
 * Екранування навмисно немає: код учня виконується в замкненій пісочниці
 * (`sandbox="allow-scripts"` без `allow-same-origin`), тож будь-що, що він
 * туди напише, лишається всередині й до застосунку не дістає.
 */
const buildHtmlCssDocument = (files: RunnerFile[]) => `<!doctype html>
<html lang="uk">
  <head>
    <meta charset="utf-8" />
    <style>${joinByLanguage(files, "css")}</style>
  </head>
  <body>${joinByLanguage(files, "html")}</body>
</html>`;

const htmlCssPreview: LessonRuntime = {
  id: "html-css-preview",
  hasEditor: true,
  mobileSupported: false,
  buildDocument: buildHtmlCssDocument,
  Preview: null,
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
 * порожній запис виглядав би як підтримка, якої немає. Зʼявляться у Фазах 3–4
 * разом зі справжніми реалізаціями.
 */
export const lessonRuntimes: LessonRuntimeRegistry = {
  "html-css-preview": htmlCssPreview,
  "theory-only": theoryOnly,
  video,
};

export const getLessonRuntime = (type: LessonRuntimeType): LessonRuntime | null =>
  lessonRuntimes[type] ?? null;
