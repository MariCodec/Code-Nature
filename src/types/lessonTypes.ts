export type LessonCategory = "html" | "css";

/** Теорія (для Docs) — зберігається як JSON */
export type TheoryBlock =
  | { type: "text"; content: string }
  | { type: "list"; items: string[] }
  | { type: "code"; lang: "html" | "css"; content: string }
  | { type: "note"; tone: "info" | "warning"; content: string };

export type LessonTheory = {
  title?: string;
  blocks: TheoryBlock[];
};

/** Декларативні перевірки (серіалізуються) */
export type HtmlSelectorRule = {
  selector: string;
  /** опційно: "наступний тег" для порядку */
  next?: string;
};

export type CssCheckRule = {
  selector: string;
  /** краще string, а не keyof CSSStyleDeclaration (бо для БД/API простіше) */
  property: string;
  value: string;
};

/**
 * Розширювана схема правил. Тегований union: `kind` каже, **чим** перевіряти.
 * Важливо: НІЯКИХ функцій, тільки JSON.
 *
 * `dom` поки без обовʼязкового тега — щоб наявний контент лишався валідним.
 * Повний перехід на явний тег відбудеться у Фазі 1 разом з рештою контрактів.
 */
export type DomTaskRules = {
  kind?: "dom";
  htmlSelectors?: HtmlSelectorRule[];
  cssChecks?: CssCheckRule[];
  requireTextContains?: { selector: string; text: string }[];
};

export type QuizOption = {
  id: string;
  text: string;
};

export type QuizTaskRules = {
  kind: "quiz";
  /**
   * Задає автор, а не кількість правильних варіантів: якщо інтерфейс сам
   * перемикається radio↔checkbox, він видає відповідь.
   */
  selectionMode?: "single" | "multiple";
  options: QuizOption[];
  correctOptionIds: string[];
  explanation: string;
  /** Урок, до якого відіслати при помилці. */
  reviewLessonId?: string;
};

export type TaskRules = DomTaskRules | QuizTaskRules;

export type LessonTask = {
  id: string;
  text: string;
  rules: TaskRules;
};

/** Для списків/навігації (легке) */
export type LessonMeta = {
  id: string; // напр. "intro" або "html:intro"
  category: LessonCategory;
  order: number;

  title: string;
  description: string;
  version: number; // напр. 1
};

/** Повний контент уроку */
export type LessonContent = LessonMeta & {
  initialHtml: string;
  initialCss: string;
  tasks: LessonTask[];
  theory?: LessonTheory;
};
/** Те, що зараз у тебе як lessonData */
export type LessonsByCategory = Record<LessonCategory, LessonContent[]>;
