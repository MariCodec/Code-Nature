// Описує окреме завдання в уроці
export type LessonTask = {
  id: string; // Унікальний ідентифікатор завдання
  text: string; // Опис завдання
  correctHtml?: string; // ОЧІКУВАНИЙ HTML
  correctCss?: string; // ОЧІКУВАНИЙ CSS;
};

// Описує окремий урок
export type LessonItem = {
  id: string; // Унікальний ідентифікатор уроку
  title: string; // Назва уроку
  description: string; // Опис уроку
  tasks: LessonTask[]; // Масив завдань уроку
  initialHtml: string; // Початковий HTML-код
  initialCss: string; // Початковий CSS-код
  // initialJs: string; // Початковий JavaScript-код
};

// Список доступних категорій
export type LessonCategory = "html" | "css";

// Описує структуру всіх уроків (ключ — категорія, значення — масив уроків)
export type Lessons = {
  [key in LessonCategory]: LessonItem[];
};
