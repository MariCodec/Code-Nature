// data/lessonData.ts
import { Lessons } from "../types/lessonTypes";
import { validateHtmlCss } from "../utils/validateHtmlCss";
export const lessons: Lessons = {
  html: [
    {
      id: "intro",
      title: "Основи HTML",
      description: "Вивчимо базові теги HTML.",
      initialHtml: `<h1>Привіт, HTML!</h1>`,
      initialCss: `h1 { color: red; }`,
      tasks: [
   {
  id: "task-1",
  text: "Створіть заголовок <h2> зеленого кольору та додайте абзац <p> після нього",
  validateHtmlCss: (doc: Document) =>
    validateHtmlCss(doc, {
      htmlSelectors: [
        { selector: "h2" }
      ],
      cssChecks: [
        { selector: "h2", property: "color", value: "rgb(0, 128, 0)" }
      ]
    }),
},
        {
          id: "task-2",
          text: "Додайте абзац <p> після заголовка.",
          validate: (doc: Document) => !!doc.querySelector("h1 + h2 + p"),
        },
      ],
    },
    {
      id: "tag",
      title: "Основи HTML 2",
      description: "Додаємо нові теги.",
      initialHtml: `<h2>Привіт, HTML!</h2>`,
      initialCss: `h2 { color: blue; }`,
      tasks: [
        {
          id: "task-1",
          text: "Створіть заголовок <h2>.",
          validate: (doc: Document) => !!doc.querySelector("h2"),
        },
        {
          id: "task-2",
          text: "Додайте абзац <p> після заголовка.",
          validate: (doc: Document) => !!doc.querySelector("h2 + p"),
        },
      ],
    },
  ],
  css: [
    {
      id: "flex",
      title: "CSS Flexbox",
      description: "Опануємо основи Flexbox.",
      initialHtml: `<div class="flex"><div>1</div><div>2</div></div>`,
      initialCss: `.flex { display: flex; gap: 10px; }`,
      tasks: [
        {
          id: "task-1",
          text: "Оформіть контейнер як flex.",
          validate: (doc: Document) => {
            const el = doc.querySelector(".flex") as HTMLElement | null;
            return el ? getComputedStyle(el).display === "flex" : false;
          },
        },
      ],
    },
    {
      id: "grid",
      title: "CSS Grid",
      description: "Розглянемо базові властивості Grid.",
      initialHtml: `<div class="grid"><div>1</div><div>2</div></div>`,
      initialCss: `.grid { display: grid; grid-template-columns: 1fr 1fr; }`,
      tasks: [
        {
          id: "task-1",
          text: "Оформіть контейнер за допомогою grid.",
          validate: (doc: Document) => {
            const el = doc.querySelector(".grid") as HTMLElement | null;
            return el ? getComputedStyle(el).display === "grid" : false;
          },
        },
      ],
    },
  ],
};
