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
