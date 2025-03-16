import { Lesson } from "../types/lessonTypes";
export const htmlLessons: Lesson[] = [
  {
    id: "intro",
    title: "Основи HTML",
    description: "Вивчимо базові теги HTML.",
    task: "Створіть заголовок <h1> та абзац <p>.",
    initialHtml: `<h1>Привіт, HTML!</h1>`,
    initialCss: `h1 { color: red; }`,
    initialJs: `console.log("Hello, JavaScript!");`,
  },
  {
    id: "tags",
    title: "HTML Списки",
    description: "Дізнаємось, як створювати списки.",
    task: "Створіть нумерований та ненумерований список.",
    initialHtml: `<ul><li>Пункт 1</li><li>Пункт 2</li></ul>`,
    initialCss: `ul { color: blue; }`,
    initialJs: `console.log("Списки в HTML!");`,
  },
];
export const cssLessons: Lesson[] = [
  {
    id: "1",
    title: "Основи HTML",
    description: "Вивчимо базові теги HTML.",
    task: "Створіть заголовок <h1> та абзац <p>.",
    initialHtml: `<h1>Привіт, HTML!</h1>`,
    initialCss: `h1 { color: red; }`,
    initialJs: `console.log("Hello, JavaScript!");`,
  },
  {
    id: "2",
    title: "HTML Списки",
    description: "Дізнаємось, як створювати списки.",
    task: "Створіть нумерований та ненумерований список.",
    initialHtml: `<ul><li>Пункт 1</li><li>Пункт 2</li></ul>`,
    initialCss: `ul { color: blue; }`,
    initialJs: `console.log("Списки в HTML!");`,
  },
];
