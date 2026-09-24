// @vitest-environment happy-dom
// @vitest-environment-options { "settings": { "disableCSSFileLoading": true, "handleDisabledFileLoadingAsSuccess": true } }

/**
 * Три умови правила тестів збігаються: чиста функція, помилка **тиха** (стилі
 * просто не застосувались), наслідок серйозний — завдання з `cssChecks` стає
 * непрохідним, а учень шукає помилку в себе.
 *
 * Перевіряються саме три рядки таблиці з розділу 5: правильне посилання,
 * посилання з одруком і відсутнє посилання. Це і є той ефект, заради якого
 * рушій перестав обгортати файл учня.
 */

import { describe, expect, it } from "vitest";

import { applyNeighborFiles, composePage, findEntryFile } from "./composeDocument";
import type { RunnerFile } from "../domain/runner";

const cssFile: RunnerFile = {
  name: "style.css",
  language: "css",
  content: "h1 { color: green; }",
  isEntry: false,
};

/**
 * `<link>` у документі happy-dom **справді** йде вантажити `style.css` мережею —
 * рівно так, як це зробить браузер, бо підстановка лишає елемент на місці.
 * У браузері це правильно (див. коментар до `applyNeighborFiles`), у тесті —
 * стук у localhost:3000, тому завантаження вимкнене опціями середовища вгорі файлу.
 */
const parse = (html: string) => {
  const doc = document.implementation.createHTMLDocument("тест");
  doc.documentElement.innerHTML = html
    .replace(/^<html[^>]*>/, "")
    .replace(/<\/html>$/, "");
  return doc;
};

const stylesOf = (doc: Document) =>
  Array.from(doc.querySelectorAll("style")).map((style) => style.textContent);

describe("підстановка сусідніх файлів", () => {
  it("правильне посилання — стилі підставлені одразу після елемента", () => {
    const doc = parse(
      `<html><head><link rel="stylesheet" href="style.css"></head><body></body></html>`,
    );
    applyNeighborFiles(doc, [cssFile]);

    const link = doc.querySelector("link");
    expect(link?.nextElementSibling?.tagName.toLowerCase()).toBe("style");
    expect(stylesOf(doc)).toEqual(["h1 { color: green; }"]);
  });

  it("`./style.css` — те саме посилання", () => {
    const doc = parse(`<html><head><link rel="stylesheet" href="./style.css"></head></html>`);
    applyNeighborFiles(doc, [cssFile]);
    expect(stylesOf(doc)).toEqual(["h1 { color: green; }"]);
  });

  it("одрук в імені файлу — сторінка без стилів, а елемент лишається", () => {
    const doc = parse(`<html><head><link rel="stylesheet" href="styl.css"></head></html>`);
    applyNeighborFiles(doc, [cssFile]);

    expect(stylesOf(doc)).toEqual([]);
    // Селекторне правило по `link` має працювати: елемент на місці, помилка в href.
    expect(doc.querySelectorAll("link").length).toBe(1);
  });

  it("посилання немає — стилів немає", () => {
    const doc = parse(`<html><head></head><body><h1>Привіт</h1></body></html>`);
    applyNeighborFiles(doc, [cssFile]);
    expect(stylesOf(doc)).toEqual([]);
  });

  it("посилання на html-файл стилями не стає", () => {
    const doc = parse(`<html><head><link rel="stylesheet" href="index.html"></head></html>`);
    applyNeighborFiles(doc, [
      { name: "index.html", language: "html", content: "<h1>ой</h1>", isEntry: true },
    ]);
    expect(stylesOf(doc)).toEqual([]);
  });
});

describe("головний файл уроку", () => {
  it("береться з `isEntry`, а не з імені", () => {
    const entry: RunnerFile = {
      name: "home.html",
      language: "html",
      content: "<h1>Привіт</h1>",
      isEntry: true,
    };
    expect(findEntryFile([cssFile, entry])).toBe(entry);
  });

  it("без позначеного файлу — null, а не перший-ліпший", () => {
    expect(findEntryFile([cssFile])).toBeNull();
  });
});

describe("сторінка для пісочниці", () => {
  const agent = "window.__agent = 1;";

  it("doctype учня зберігається — його ж перевіряє правило", () => {
    const page = composePage(
      '<!DOCTYPE html><html lang="uk"><head><title>Мій сайт</title></head><body><h1>Привіт</h1></body></html>',
      [],
      agent,
    );

    expect(page.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(page).toContain('lang="uk"');
    expect(page).toContain("<title>Мій сайт</title>");
  });

  it("без doctype його ніхто не дописує: учень має бачити наслідок", () => {
    expect(composePage("<h1>Привіт</h1>", [], agent).startsWith("<!DOCTYPE")).toBe(false);
  });

  it("агент іде першим у head — раніше за будь-який скрипт учня", () => {
    const page = composePage(
      "<html><head><script>first()</script></head><body></body></html>",
      [],
      agent,
    );

    expect(page.indexOf(agent)).toBeLessThan(page.indexOf("first()"));
  });
});

describe("вставлене нами не рве сторінку", () => {
  it("`</style>` у CSS учня не закриває підставлений стиль", () => {
    const doc = parse(`<html><head><link rel="stylesheet" href="style.css"></head></html>`);
    applyNeighborFiles(doc, [
      { ...cssFile, content: "/* тут був </style> */ h1 { color: red; }" },
    ]);

    // Серіалізація вмісту `<style>` нічого не екранує, тож розрив мав би
    // статись саме тут — і саме тут його не має бути.
    const style = doc.querySelector("style");
    expect(style?.textContent).not.toContain("</style>");
    expect(style?.textContent).toContain("h1 { color: red; }");
  });

  it("`</script>` у коді агента не закриває його тег", () => {
    const page = composePage("<h1>Привіт</h1>", [], 'const s = "</script>";');
    expect(page).not.toContain('"</script>"');
    expect(page).toContain(String.raw`"<\/script>"`);
  });
});
