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
 * ⚠️ ПІСОЧНИЦІ ЩЕ НЕМАЄ. Цей документ виконується у звичайному iframe **на origin
 * застосунку** (`Output.tsx`, `checkLesson.ts`), тобто `<script>` в уроці має доступ
 * до `parent.localStorage`, де лежить токен сесії. Поки код пише сам учень, він
 * шкодить лише собі; з появою контенту з БД і рецензування це стає збереженим XSS.
 *
 * Замикається у **Фазі 3**: `sandbox="allow-scripts"` без `allow-same-origin`
 * і звʼязок повідомленнями. До того часу екранування тут немає не тому, що воно
 * не потрібне, а тому, що його ще ніхто не написав.
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
