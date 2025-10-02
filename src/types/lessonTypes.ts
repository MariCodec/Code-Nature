// types/lessonTypes.ts
export type LessonTask = {
  id: string; // Унікальний ідентифікатор завдання
  text: string; // Опис завдання
  htmlSelectors?: { selector: string; next?: string }[]; // селектор і наступний тег (для перевірки порядку)
  cssChecks?: { selector: string; property: keyof CSSStyleDeclaration; value: string }[]; // перевірки CSS
  validate?: (doc: Document) => boolean; // Функція перевірки DOM
   validateHtmlCss?: (doc: Document) => boolean;
};

export type LessonItem = {
  id: string; // Унікальний ідентифікатор уроку
  title: string; // Назва уроку
  description: string; // Опис уроку
  tasks: LessonTask[]; // Масив завдань уроку
  initialHtml: string; // Початковий HTML-код
  initialCss: string; // Початковий CSS-код
};

export type LessonCategory = "html" | "css";

export type Lessons = {
  [key in LessonCategory]: LessonItem[];
};
