// data/lessonData.ts
import { Lessons } from "../types/lessonTypes";

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
          text: "Створіть заголовок <h1> зеленого кольору",
          htmlSelectors: [{ selector: "h1" }],
          cssChecks: [
            { selector: "h1", property: "color", value: "rgb(0, 128, 0)" },
          ],
        },
        {
          id: "task-2",
          text: "Додайте абзац <p> після заголовка.",
          htmlSelectors: [{ selector: "p" }],
         
        },
        {
          id: "task-3",
          text: "Додайте абзац <p> після заголовка.",
          htmlSelectors: [{ selector: "p" }],
         
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
          htmlSelectors: [{ selector: "h2" }],
          cssChecks: [
            { selector: "h2", property: "color", value: "rgb(0, 128, 0)" },
          ],
        },
        {
          id: "task-2",
          text: "Додайте абзац <p> після заголовка.....",
          htmlSelectors: [{ selector: "p" }],
         
        },
      ],
    },
  ],
  css: [
    
   
  ],
};
