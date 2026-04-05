import type { LessonFileDTO } from "../types/content";

export const getInitialHtmlFromLessonFiles = (files: LessonFileDTO[]): string =>
  files.find((file) => file.name === "index.html")?.initialContent ?? "";

export const getInitialCssFromLessonFiles = (files: LessonFileDTO[]): string =>
  files.find((file) => file.name === "style.css")?.initialContent ?? "";
