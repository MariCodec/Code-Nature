import { Lessons } from "../types/lessonTypes";
export const lessons: Lessons = {
  html: [
    {
      id: "intro",
      title: "Основи HTML",
      description: "Вивчимо базові теги HTML.",
      tasks: [
        {
          id: "task-1",
          text: "Створіть заголовок <h1>.",
          correctHtml: `<h1>Привіт, HTML!</h1>`,
        },
        {
          id: "task-2",
          text: "Додайте абзац <p> після заголовка.",
          correctHtml: `<h1>Привіт, HTML!</h1><p>Це абзац.</p>`,
        },
      ],
      initialHtml: `<h1>Привіт, HTML!</h1>`,
      initialCss: `h1 { color: red; }`,
    },
    {
      id: "tag",
      title: "Основи HTML",
      description: "Вивчимо базові теги HTML.",
      tasks: [
        {
          id: "task-1",
          text: "Створіть заголовок <h2>.",
          correctHtml: `<h2>Привіт, HTML!</h2>`,
        },
        {
          id: "task-2",
          text: "Додайте абзац <p> після заголовка.",
          correctHtml: `<h1>Привіт, HTML!</h1><p>Це абзац.</p>`,
        },
      ],
      initialHtml: `<h2>Привіт, HTML!</h2>`,
      initialCss: `h2 { color: blue; }`,
    },
  ],
  css: [
    {
      id: "flex",
      title: "CSS Flexbox",
      description: "Опануємо основи Flexbox.",
      tasks: [
        {
          id: "task-1",
          text: "Оформіть контейнер за допомогою flex.",
          correctCss: `.container { display: flex; }`,
        },
      ],
      initialHtml: `<div class="container"><div>1</div><div>2</div></div>`,
      initialCss: `.container { display: flex; }`,
    },
    {
      id: "grid",
      title: "CSS Grid",
      description: "Розглянемо базові властивості Grid.",
      tasks: [
        {
          id: "task-1",
          text: "Оформіть контейнер за допомогою grid.",
          correctCss: `.grid { display: grid; grid-template-columns: 1fr 1fr; }`,
        },
      ],
      initialHtml: `<div class="grid"><div>1</div><div>2</div></div>`,
      initialCss: `.grid { display: grid; grid-template-columns: 1fr 1fr; }`,
    },
  ],
};
