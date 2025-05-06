export enum FileNames {
  // SCRIPT = "script.js",
  STYLE = "style.css",
  HTML = "index.html",
}

export interface FileData {
  name: string;
  language: string;
  value: string;
}

export interface Files {
  // [FileNames.SCRIPT]: FileData;
  [FileNames.STYLE]: FileData;
  [FileNames.HTML]: FileData;
}
export type LessonDetails = {
  info: string;
  tasks: string[];
};
