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

import { parseCatalog, parseLesson } from "./parseContent";
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

  it("головним не може бути css", () => {
    const issues = withFiles([file("index.html", "html", true), file("style.css", "css", true)]);
    expect(format(issues)).toContain("головним може бути лише html");
  });
});
