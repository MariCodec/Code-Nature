/**
 * Схема-перевірка контенту: `src/content/*.json` звіряється з типами проєкту.
 *
 * Дірка між уроками Фази 0 і типами Фази 1 прожила цілу фазу, бо `tsc` її не бачить:
 * JSON не типізується, поки його ніхто не імпортує. Тест читає **усі** файли теки,
 * а не перелік — новий урок перевіряється сам, без правки цього файла.
 *
 * Три умови правила тестів збігаються: розбір — чиста функція, помилка тиха
 * (урок просто не відкриється або завдання не зарахується), наслідок — заблокований учень.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { checkLessonReferences, parseCatalog, parseLesson } from "./parseContent";
import type { ContentIssue } from "./parseContent";

const CONTENT_DIR = join(__dirname);
const LESSONS_DIR = join(CONTENT_DIR, "lessons");

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));

const format = (issues: ContentIssue[]) =>
  issues.map((issue) => `${issue.where}: ${issue.message}`).join("\n");

const lessonFiles = readdirSync(LESSONS_DIR).filter((name) => name.endsWith(".json"));

describe("контент звіряється з типами проєкту", () => {
  it("уроки взагалі є — інакше тест зелений і нічого не перевіряє", () => {
    expect(lessonFiles.length).toBeGreaterThan(0);
  });

  it.each(lessonFiles)("%s", (name) => {
    const { issues } = parseLesson(readJson(join(LESSONS_DIR, name)), name);
    expect(format(issues)).toBe("");
  });

  it("catalog.json", () => {
    const { issues } = parseCatalog(readJson(join(CONTENT_DIR, "catalog.json")), "catalog.json");
    expect(format(issues)).toBe("");
  });
});

/**
 * Питання техчека — це **ворота**: питання, яке не зараховується ніколи,
 * замикає модуль назавжди. Форма правил при цьому бездоганна, тож помилку
 * не бачить ні `tsc`, ні перевірка типів — лише звірка полів між собою.
 */
describe("питання, яке неможливо розвʼязати", () => {
  const quiz = (rules: Record<string, unknown>) => {
    const raw = readJson(join(LESSONS_DIR, "html-start-techcheck.json")) as {
      tasks: { rules: Record<string, unknown> }[];
    };
    raw.tasks[0].rules = {
      kind: "quiz",
      options: [
        { id: "a", text: "перший" },
        { id: "b", text: "другий" },
      ],
      correctOptionIds: ["a"],
      explanation: "бо так",
      ...rules,
    };
    return parseLesson(raw, "питання").issues;
  };

  it("правильне питання проходить", () => {
    expect(format(quiz({}))).toBe("");
  });

  it("правильна відповідь вказує на варіант, якого немає", () => {
    expect(format(quiz({ correctOptionIds: ["z"] }))).toContain(
      'вказує на варіант "z", якого немає',
    );
  });

  it("питання без правильної відповіді не проходить", () => {
    expect(format(quiz({ correctOptionIds: [] }))).toContain("без правильної відповіді");
  });

  it("два варіанти з однаковим id не проходять", () => {
    const issues = quiz({
      options: [
        { id: "a", text: "перший" },
        { id: "a", text: "другий" },
      ],
    });
    expect(format(issues)).toContain("однаковим id");
  });

  it("single з кількома правильними — питання, яке не закриває ніхто", () => {
    // `single` малює radio: обрати можна один варіант, а зараховується
    // лише повний збіг. Разом це непрохідні ворота.
    const issues = quiz({ selectionMode: "single", correctOptionIds: ["a", "b"] });
    expect(format(issues)).toContain("обрати всі неможливо");
  });
});

/**
 * Посилання **між** уроками: розбір одного файлу його перевірити не може.
 * Ламається тихо й у найгіршому місці — учень щойно помилився в техчеку,
 * натиснув «повернутись до уроку» й отримав «Урок не знайдено».
 */
describe("посилання між уроками", () => {
  const lessons = lessonFiles.map(
    (name) => parseLesson(readJson(join(LESSONS_DIR, name)), name).lesson,
  );

  it("усі reviewLessonId ведуть до наявних уроків", () => {
    expect(format(checkLessonReferences(lessons))).toBe("");
  });

  it("посилання на неіснуючий урок не проходить", () => {
    const broken = lessons.map((lesson) => ({
      ...lesson,
      tasks: lesson.tasks.map((task) =>
        task.rules.kind === "quiz" && task.rules.reviewLessonId
          ? { ...task, rules: { ...task.rules, reviewLessonId: "lsn_якого_немає" } }
          : task,
      ),
    }));

    expect(format(checkLessonReferences(broken))).toContain("не існує");
  });

  it("урок, який відсилає сам на себе, не проходить", () => {
    const selfReferring = lessons.map((lesson) => ({
      ...lesson,
      tasks: lesson.tasks.map((task) =>
        task.rules.kind === "quiz" && task.rules.reviewLessonId
          ? { ...task, rules: { ...task.rules, reviewLessonId: lesson.id } }
          : task,
      ),
    }));

    expect(format(checkLessonReferences(selfReferring))).toContain("сам на себе");
  });
});

describe("перевірка справді щось ловить", () => {
  it("описка в назві правила не проходить мовчки", () => {
    const raw = readJson(join(LESSONS_DIR, "html-first-page.json")) as {
      tasks: { rules: Record<string, unknown> }[];
    };
    raw.tasks[0].rules = { kind: "dom", selectorz: [{ selector: "h1" }] };

    const { issues } = parseLesson(raw, "описка");
    expect(format(issues)).toContain('невідоме поле "selectorz"');
  });

  it("невідоме значення enum не проходить", () => {
    const raw = readJson(join(LESSONS_DIR, "html-first-page.json")) as Record<string, unknown>;
    raw.validationType = "dom-check";

    const { issues } = parseLesson(raw, "старий діалект");
    expect(format(issues)).toContain("validationType");
  });
});

/**
 * Розтяжка знята у Фазі 3 — саме так, як було задумано.
 *
 * Доки рушій загортав файл учня у власний `<!doctype>` і `<html lang>`, правило
 * про документ бачило б обгортку, тобто зараховувалось би на порожньому файлі.
 * Тому парсер його не знав, а тест тримав цей стан і **мусив упасти** разом
 * із форматом документа. Обидві половини й приїхали разом: entry-файл став цілим
 * документом, рушій не додає нічого — і правило стало чесним.
 */
describe("document-правила відкриті контенту", () => {
  it("урок із document-правилом проходить схема-перевірку", () => {
    const raw = readJson(join(LESSONS_DIR, "html-first-page.json")) as {
      tasks: { rules: Record<string, unknown> }[];
    };
    raw.tasks[0].rules = {
      kind: "dom",
      selectors: [{ selector: "h1" }],
      document: { hasDoctype: true, lang: "uk", title: "Мій сайт", charset: "utf-8" },
    };

    const { issues } = parseLesson(raw, "document у Фазі 3");
    expect(format(issues)).toBe("");
  });

  it("правило без жодної умови не проходить", () => {
    const raw = readJson(join(LESSONS_DIR, "html-first-page.json")) as {
      tasks: { rules: Record<string, unknown> }[];
    };
    // `hasDoctype: false` — це «не перевіряти», тож умов тут нуль.
    raw.tasks[0].rules = { kind: "dom", document: { hasDoctype: false } };

    const { issues } = parseLesson(raw, "порожнє document-правило");
    expect(format(issues)).toContain("правило про документ без жодної умови");
  });
});

/**
 * Ассети. Картинка, яка веде в нікуди, — тиха помилка автора: учень бачить
 * порожню рамку, і урок про зображення втрачає сенс.
 */
describe("ассети", () => {
  const withAssets = (assets: unknown, html: string) => {
    const raw = readJson(join(LESSONS_DIR, "css-first-styles.json")) as Record<string, unknown>;
    raw.assets = assets;
    (raw.files as { initialContent: string; isEntry: boolean }[]).find(
      (file) => file.isEntry,
    )!.initialContent = html;
    return parseLesson(raw, "ассети").issues;
  };

  const page = (body: string) =>
    `<html><head><link rel="stylesheet" href="style.css"></head><body>${body}</body></html>`;

  it("оголошений ассет і посилання на нього проходять", () => {
    const issues = withAssets(
      [{ name: "beans.svg", url: "/content/assets/beans.svg" }],
      page('<img src="beans.svg" alt="Зерна">'),
    );
    expect(format(issues)).toBe("");
  });

  it("картинка без ассета не проходить", () => {
    const issues = withAssets([], page('<img src="beans.svg" alt="Зерна">'));
    expect(format(issues)).toContain("картинка веде в нікуди");
  });

  it("зовнішня картинка ассета не потребує", () => {
    const issues = withAssets([], page('<img src="https://example.com/x.png" alt="x">'));
    expect(format(issues)).toBe("");
  });

  it("два ассети з одним імʼям не проходять", () => {
    const issues = withAssets(
      [
        { name: "beans.svg", url: "/a.svg" },
        { name: "beans.svg", url: "/b.svg" },
      ],
      page(""),
    );
    expect(format(issues)).toContain("два ассети з імʼям");
  });
});

/**
 * Дії перед перевіркою. Без них JavaScript неперевірний, але помилка в них
 * така сама тиха, як в описці назви правила: автор пише `"act"` з невідомим
 * видом дії — і завдання мовчки перевіряється без неї.
 */
describe("дії перед перевіркою", () => {
  const withRules = (rules: Record<string, unknown>) => {
    const raw = readJson(join(LESSONS_DIR, "html-first-page.json")) as {
      tasks: { rules: Record<string, unknown> }[];
    };
    raw.tasks[0].rules = rules;
    return parseLesson(raw, "дії").issues;
  };

  it("клік із селектором проходить", () => {
    const issues = withRules({
      kind: "dom",
      act: [{ kind: "click", selector: "#greet" }],
      selectors: [{ selector: "h1" }],
    });
    expect(format(issues)).toBe("");
  });

  it("невідомий вид дії не проходить", () => {
    const issues = withRules({
      kind: "dom",
      act: [{ kind: "scroll", selector: "#greet" }],
      selectors: [{ selector: "h1" }],
    });
    expect(format(issues)).toContain("kind");
  });

  it("введення тексту потребує самого тексту", () => {
    const issues = withRules({
      kind: "dom",
      act: [{ kind: "type", selector: "#name" }],
      selectors: [{ selector: "h1" }],
    });
    expect(format(issues)).toContain("text");
  });

  it("самі дії, без жодної умови — не завдання", () => {
    // Умова «всі правила пройшли» істинна на порожній множині, тож таке
    // завдання зараховувалось би завжди.
    const issues = withRules({ kind: "dom", act: [{ kind: "click", selector: "#greet" }] });
    expect(format(issues)).toContain("без жодного правила");
  });
});

/**
 * Головний файл. Помилка тут тиха й дорога: пісочниця показала б порожню
 * сторінку, а учень шукав би причину в своєму коді.
 */
describe("головний файл уроку", () => {
  const withFiles = (files: Record<string, unknown>[]) => {
    const raw = readJson(join(LESSONS_DIR, "css-first-styles.json")) as Record<string, unknown>;
    raw.files = files;
    return parseLesson(raw, "файли").issues;
  };

  const file = (name: string, language: string, isEntry: boolean) => ({
    id: `fil_${name}`,
    name,
    language,
    initialContent: "",
    orderIndex: 1,
    isEditable: true,
    isEntry,
  });

  it("без жодного isEntry не проходить", () => {
    expect(format(withFiles([file("index.html", "html", false)]))).toContain(
      "жоден файл не позначений isEntry",
    );
  });

  it("два головні файли не проходять", () => {
    const issues = withFiles([
      file("index.html", "html", true),
      file("about.html", "html", true),
    ]);
    expect(format(issues)).toContain("головних файлів має бути один");
  });

  it("урок, де посилання пише учень, не вимагає його в заготовці", () => {
    // Редагований entry без `<link>` — це урок «підключи таблицю стилів»,
    // а не забутий автором рядок.
    const issues = withFiles([
      {
        ...file("index.html", "html", true),
        isEditable: true,
        initialContent: "<html><body></body></html>",
      },
      file("style.css", "css", false),
    ]);
    expect(format(issues)).toBe("");
  });

  it("css-файл без <link> в заблокованому entry не проходить", () => {
    // Рушій більше не інжектить стилі від себе: без посилання файл просто
    // не потрапляє на сторінку, і урок виглядає зламаним для всіх учнів.
    const issues = withFiles([
      {
        ...file("index.html", "html", true),
        isEditable: false,
        initialContent: "<html><body></body></html>",
      },
      file("style.css", "css", false),
    ]);
    expect(format(issues)).toContain("немає <link rel=\"stylesheet\">");
  });

  it("<link> на файл, якого в уроці немає, теж не проходить", () => {
    const issues = withFiles([
      {
        ...file("index.html", "html", true),
        initialContent: '<html><head><link rel="stylesheet" href="styl.css"></head></html>',
      },
      file("style.css", "css", false),
    ]);
    expect(format(issues)).toContain("такого css-файлу в уроці немає");
  });

  it("зовнішній <link> файлом уроку не вважається", () => {
    const issues = withFiles([
      {
        ...file("index.html", "html", true),
        initialContent:
          '<html><head><link rel="stylesheet" href="https://fonts.example/x.css">' +
          '<link rel="stylesheet" href="style.css"></head></html>',
      },
      file("style.css", "css", false),
    ]);
    expect(format(issues)).toBe("");
  });

  it("головним не може бути css", () => {
    const issues = withFiles([file("index.html", "html", true), file("style.css", "css", true)]);
    expect(format(issues)).toContain("головним може бути лише html");
  });
});
