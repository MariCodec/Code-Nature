import type { StudentSavedFileDTO } from "../types/content";

export const buildSavedFiles = (
  html: string,
  css: string,
): StudentSavedFileDTO[] => [
  {
    name: "index.html",
    language: "html",
    content: html,
  },
  {
    name: "style.css",
    language: "css",
    content: css,
  },
];

export const getHtmlFromSavedFiles = (savedFiles: StudentSavedFileDTO[]): string =>
  savedFiles.find((file) => file.name === "index.html")?.content ?? "";

export const getCssFromSavedFiles = (savedFiles: StudentSavedFileDTO[]): string =>
  savedFiles.find((file) => file.name === "style.css")?.content ?? "";

export const getSavedFileContent = (
  savedFiles: StudentSavedFileDTO[],
  fileName: string,
): string => savedFiles.find((file) => file.name === fileName)?.content ?? "";
