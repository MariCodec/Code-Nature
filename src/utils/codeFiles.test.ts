/**
 * Збирання файлів уроку з контенту й збереженого коду.
 *
 * Три умови правила тестів збігаються: чиста функція; помилка **тиха** — ніде нічого
 * не падає, просто в редакторі не той вміст; наслідок серйозний — або втрачена
 * робота учня, або вкладка-привид, або зниклий файл, якого автор урок написав.
 */

import { describe, expect, it } from "vitest";

import { buildLessonFileStates, toSavedFiles } from "./codeFiles";
import type { LessonFileDTO, StudentSavedFileDTO } from "../types/content";

const lessonFile = (
  overrides: Partial<LessonFileDTO> & Pick<LessonFileDTO, "name">,
): LessonFileDTO => ({
  id: `fil_${overrides.name}`,
  language: "html",
  initialContent: "",
  orderIndex: 1,
  isEditable: true,
  ...overrides,
});

const saved = (name: string, content: string): StudentSavedFileDTO => ({
  name,
  language: "html",
  content,
});

describe("buildLessonFileStates", () => {
  it("без збереженого коду бере заготовку уроку", () => {
    const files = buildLessonFileStates(
      [lessonFile({ name: "index.html", initialContent: "<h1>Привіт</h1>" })],
      [],
    );

    expect(files).toHaveLength(1);
    expect(files[0].content).toBe("<h1>Привіт</h1>");
  });

  it("збережене учнем перекриває заготовку", () => {
    const files = buildLessonFileStates(
      [lessonFile({ name: "index.html", initialContent: "<h1>Привіт</h1>" })],
      [saved("index.html", "<h1>Моє</h1>")],
    );

    expect(files[0].content).toBe("<h1>Моє</h1>");
  });

  it("порожній файл лишається порожнім, а не відкочується до заготовки", () => {
    // `||` замість `??` тихо повертав би учневі текст, який той щойно стер,
    // і виглядало б це як редактор, що не слухається.
    const files = buildLessonFileStates(
      [lessonFile({ name: "style.css", language: "css", initialContent: "/* тут */" })],
      [{ name: "style.css", language: "css", content: "" }],
    );

    expect(files[0].content).toBe("");
  });

  it("перелік файлів задає урок: збережене зайве не стає вкладкою", () => {
    // Збережений код переживає зміну контенту. Якби вкладки бралися з нього,
    // файл, якого автор уже не пише, лишався б в уроці назавжди — та сама
    // помилка, що колись дала «7 з 4 задач».
    const files = buildLessonFileStates(
      [lessonFile({ name: "index.html" })],
      [saved("index.html", "<h1/>"), saved("style.css", "h1 {}")],
    );

    expect(files.map((file) => file.name)).toEqual(["index.html"]);
  });

  it("новий файл уроку зʼявляється навіть тоді, коли збереженого для нього немає", () => {
    const files = buildLessonFileStates(
      [
        lessonFile({ name: "index.html", orderIndex: 1 }),
        lessonFile({
          name: "style.css",
          language: "css",
          orderIndex: 2,
          initialContent: "/* нове */",
        }),
      ],
      [saved("index.html", "<h1/>")],
    );

    expect(files.map((file) => file.name)).toEqual(["index.html", "style.css"]);
    expect(files[1].content).toBe("/* нове */");
  });

  it("порядок вкладок — orderIndex уроку, а не порядок у масиві", () => {
    const files = buildLessonFileStates(
      [
        lessonFile({ name: "style.css", language: "css", orderIndex: 2 }),
        lessonFile({ name: "index.html", orderIndex: 1 }),
      ],
      [],
    );

    expect(files.map((file) => file.name)).toEqual(["index.html", "style.css"]);
  });

  it("isEditable читається з уроку, а не зі збереженого коду", () => {
    const files = buildLessonFileStates(
      [lessonFile({ name: "index.html", isEditable: false })],
      [saved("index.html", "<h1/>")],
    );

    expect(files[0].isEditable).toBe(false);
  });
});

describe("toSavedFiles", () => {
  it("у сховище не їде ні id, ні isEditable — вони належать уроку", () => {
    // Інакше автор уроку розблокує файл, а в учня він лишиться замкненим:
    // збережений прапорець перекрив би контент.
    const files = buildLessonFileStates(
      [lessonFile({ name: "index.html", isEditable: false, initialContent: "<h1/>" })],
      [],
    );

    expect(toSavedFiles(files)).toEqual([
      { name: "index.html", language: "html", content: "<h1/>" },
    ]);
  });
});
