import type { LessonsByCategory } from "../types/lessonTypes";

export const lessons: LessonsByCategory = {
  html: [
    {
      id: "intro",
      category: "html",
      order: 1,
      version: 1,
      title: "Основи HTML",
      description: "Вивчимо базові теги HTML.",
      initialHtml: `<h1>Привіт, HTML!</h1>`,
      initialCss: `h1 { color: red; }`,
      theory: {
        blocks: [
          { type: "text", content: "HTML — мова розмітки..." },
          {
            type: "code",
            lang: "html",
            content: "<h1>Заголовок</h1>\n<p>Абзац</p>",
          },
        ],
      },
      tasks: [
        {
          id: "task-1",
          text: "Створіть заголовок <h1> зеленого кольору",
          rules: {
            htmlSelectors: [{ selector: "h1" }],
            requireTextContains: [{ selector: "h1", text: "Привіт, HTML!" }],
            cssChecks: [
              { selector: "h1", property: "color", value: "rgb(0, 128, 0)" },
            ],
          },
        },
        {
          id: "task-2",
          text: "Створіть заголовок <h1> зеленого кольору",
          rules: {
            htmlSelectors: [{ selector: "h1" }],
            cssChecks: [
              { selector: "h1", property: "color", value: "rgb(0, 128, 0)" },
            ],
          },
        },
      ],
    },
    {
      id: "lesson-2",
      category: "html",
      order: 1,
      version: 1,
      title: "Основи HTML",
      description: "Вивчимо базові теги HTML.",
      initialHtml: `<h1>Привіт, HTML!</h1>`,
      initialCss: `h1 { color: red; }`,
      theory: {
        blocks: [
          { type: "text", content: "HTML — мова розмітки..." },
          {
            type: "code",
            lang: "html",
            content: "<h1>Заголовок</h1>\n<p>Абзац</p>",
          },
        ],
      },
      tasks: [
        {
          id: "task-1",
          text: "Створіть заголовок <p> зеленого кольору",
          rules: {
            htmlSelectors: [{ selector: "p" }],
          },
        },
      ],
    },
  ],
  css: [],
};
