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

/**
 * Декларативні перевірки. Жодних функцій — лише JSON.
 *
 * Умова, яку не можна порушувати: правило, яке неможливо виконати на сервері,
 * до `TaskRules` не потрапляє. Саме це дозволить перенести перевірку на бек,
 * коли зʼявиться платний доступ, без зміни контракту й міграції контенту
 * (PLATFORM_UA, розділ 8, «Модель довіри до перевірки»).
 */

/** Елемент є, і його щонайменше `minCount` штук. Без `minCount` — один. */
export type SelectorRule = {
  /** Будь-який CSS-селектор, включно з вкладеним: `"ul li"`. */
  selector: string;
  minCount?: number;
};

/**
 * Текст елемента. `text` — має міститись, `minLength` — мінімальна довжина
 * після обрізання пробілів. Разом означають обидві умови одночасно.
 *
 * `minLength` існує тому, що реальні завдання формулюються як «текст будь-який,
 * але не порожній» — знахідка Фази 0, яку дослівний збіг не виражає.
 */
export type TextRule = {
  selector: string;
  text?: string;
  minLength?: number;
};

/** Обчислений стиль — не той, що написаний у CSS, а той, що застосувався. */
export type CssRule = {
  selector: string;
  /** Рядок, а не `keyof CSSStyleDeclaration`: значення їде в БД і через API. */
  property: string;
  value: string;
};

/**
 * Структура самого документа, а не вмісту `<body>`.
 *
 * `hasDoctype` — єдине, чого `SelectorRule` виразити **не може**: doctype це не
 * елемент, і `querySelectorAll` його не бачить. Решту три формально можна було б
 * написати селекторами (`html[lang="uk"]`, `head > meta[charset="utf-8"]`), але
 * учень отримав би «Не знайшла html[lang="uk"] на сторінці» замість «у <html>
 * не вказана мова». Окреме правило існує заради повідомлення — та сама причина,
 * з якої результат рахується по кожному правилу окремо.
 *
 * Потрібне з моменту, коли entry-файл уроку став цілим документом: доти
 * doctype і `<head>` давав рушій, і перевіряти в них не було чого.
 *
 * **Контенту ці правила поки недоступні, і це навмисно.** Доки `buildDocument`
 * загортає файл учня у власний `<!doctype>` і `<html lang>`, вони бачили б обгортку —
 * тобто зараховувались би на порожньому файлі. Парсер контенту їх не знає, і розтяжка
 * в `content/content.test.ts` тримає цей стан до Фази 3.
 */
export type DocumentRule = {
  /** `true` — вимагати `<!doctype html>`. `false` і `undefined` — не перевіряти. */
  hasDoctype?: boolean;
  /** Значення `lang` у `<html>`; порівняння без урахування регістру. */
  lang?: string;
  /** Текст `<title>`; має збігатися повністю після обрізання пробілів. */
  title?: string;
  /** Значення `<meta charset>`; порівняння без урахування регістру. */
  charset?: string;
};

export type QuizOption = {
  id: string;
  text: string;
};

/**
 * Тегований union: `kind` каже, **чим** перевіряти. Обовʼязковий у всіх варіантах —
 * опційний тег означав би, що наступний runtime знову вгадуватимуть за формою полів.
 *
 * Варіантів рівно два, бо рівно на два є контент. `js-test`, `output` і `manual`
 * зʼявляться разом зі своїми runtime-ами (Фази 3–4): варіант без гілки у валідаторі —
 * це та сама заглушка, яких ми не робимо в реєстрі runtime-ів.
 */
export type DomTaskRules = {
  kind: "dom";
  document?: DocumentRule;
  selectors?: SelectorRule[];
  cssChecks?: CssRule[];
  textContains?: TextRule[];
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
