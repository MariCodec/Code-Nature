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
 * Розширювана схема правил.
 * Важливо: НІЯКИХ функцій, тільки JSON.
 */
export type TaskRules = {
  htmlSelectors?: HtmlSelectorRule[];
  cssChecks?: CssCheckRule[];
  /** на майбутнє: додаткові пресети */
  requireTextContains?: { selector: string; text: string }[];
};

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
