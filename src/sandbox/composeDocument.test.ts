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

describe("підстановка скриптів", () => {
  const jsFile: RunnerFile = {
    name: "script.js",
    language: "javascript",
    content: 'document.querySelector("h1").textContent = "Готово";',
    isEntry: false,
  };

  const scriptsOf = (doc: Document) =>
    Array.from(doc.querySelectorAll("script")).map((script) => ({
      src: script.getAttribute("src"),
      type: script.getAttribute("type"),
      code: script.textContent,
    }));

  it("правильне посилання — код їде одразу після елемента", () => {
    const doc = parse(
      `<html><head></head><body><h1>x</h1><script src="script.js"></script></body></html>`,
    );
    applyNeighborFiles(doc, [jsFile]);

    const original = doc.querySelector("script[src]");
    expect(original?.nextElementSibling?.tagName.toLowerCase()).toBe("script");
    expect(original?.nextElementSibling?.textContent).toBe(jsFile.content);
  });

  it("оригінал заглушений типом, але лишається з усіма атрибутами", () => {
    const doc = parse(`<html><body><script src="script.js"></script></body></html>`);
    applyNeighborFiles(doc, [jsFile]);

    // Селекторне правило по `script[src]` має працювати так само, як по `link`.
    expect(doc.querySelectorAll("script[src]").length).toBe(1);
    expect(scriptsOf(doc)[0]).toEqual({ src: "script.js", type: "text/plain", code: "" });
  });

  it("одрук в імені файлу — код не виконається, а елемент лишається", () => {
    const doc = parse(`<html><body><script src="scrpt.js"></script></body></html>`);
    applyNeighborFiles(doc, [jsFile]);

    expect(doc.querySelectorAll("script").length).toBe(1);
    expect(doc.querySelector("script")?.getAttribute("type")).toBe("text/plain");
  });

  it("зовнішній скрипт не глушиться: він справді кудись веде", () => {
    const doc = parse(
      `<html><body><script src="https://cdn.example/lib.js"></script></body></html>`,
    );
    applyNeighborFiles(doc, [jsFile]);

    expect(doc.querySelector("script")?.getAttribute("type")).toBeNull();
    expect(doc.querySelectorAll("script").length).toBe(1);
  });

  it("посилання на css-файл скриптом не стає", () => {
    const doc = parse(`<html><body><script src="style.css"></script></body></html>`);
    applyNeighborFiles(doc, [cssFile]);

    expect(doc.querySelectorAll("script").length).toBe(1);
  });

  it("`</script>` у коді учня не закриває вставлений тег", () => {
    const doc = parse(`<html><body><script src="script.js"></script></body></html>`);
    applyNeighborFiles(doc, [{ ...jsFile, content: 'const s = "</script>";' }]);

    const inline = doc.querySelector("script[src]")?.nextElementSibling;
    expect(inline?.textContent).not.toContain("</script>");
    expect(inline?.textContent).toContain(String.raw`"<\/script>"`);
  });
});

describe("ассети", () => {
  const assets = [{ name: "beans.svg", url: "/content/assets/beans.svg" }];

  it("`<img src>` отримує справжню адресу за імʼям ассета", () => {
    const doc = parse(`<html><body><img src="beans.svg" alt="Зерна"></body></html>`);
    applyNeighborFiles(doc, [], assets);

    const img = doc.querySelector("img");
    expect(img?.getAttribute("src")).toBe("/content/assets/beans.svg");
    // Решта атрибутів учня лишається: правило `img[src][alt]` має працювати.
    expect(img?.getAttribute("alt")).toBe("Зерна");
  });

  it("`url()` у **вставленому** css розвʼязується так само", () => {
    const doc = parse(
      `<html><head><link rel="stylesheet" href="style.css"></head></html>`,
    );
    applyNeighborFiles(
      doc,
      [{ ...cssFile, content: ".card { background: url(beans.svg) no-repeat; }" }],
      assets,
    );

    // Css-файл інлайниться в `<style>`, тож відносний url резолвиться
    // в порожнечу — фон мовчки не працював би.
    expect(doc.querySelector("style")?.textContent).toContain(
      "url(/content/assets/beans.svg)",
    );
  });

  it("лапки всередині url() зберігаються", () => {
    const doc = parse(`<html><head><style>b { background: url("beans.svg"); }</style></head></html>`);
    applyNeighborFiles(doc, [], assets);
    expect(doc.querySelector("style")?.textContent).toContain(
      'url("/content/assets/beans.svg")',
    );
  });

  it("зовнішня адреса не підміняється", () => {
    const doc = parse(`<html><body><img src="https://example.com/x.png"></body></html>`);
    applyNeighborFiles(doc, [], assets);
    expect(doc.querySelector("img")?.getAttribute("src")).toBe("https://example.com/x.png");
  });

  it("невідоме імʼя лишається як є — одрук має мати наслідок", () => {
    const doc = parse(`<html><body><img src="bean.svg"></body></html>`);
    applyNeighborFiles(doc, [], assets);
    expect(doc.querySelector("img")?.getAttribute("src")).toBe("bean.svg");
  });
});

describe("глушник стоїть лише на відносних посиланнях", () => {
  it("зовнішня таблиця стилів не глушиться — урок про шрифти став можливим", () => {
    const doc = parse(
      `<html><head><link rel="stylesheet" href="https://fonts.example/inter.css"></head></html>`,
    );
    applyNeighborFiles(doc, []);
    expect(doc.querySelector("link")?.getAttribute("media")).toBeNull();
  });

  it("протокольно-відносне посилання теж зовнішнє", () => {
    const doc = parse(`<html><head><link rel="stylesheet" href="//cdn.example/x.css"></head></html>`);
    applyNeighborFiles(doc, []);
    expect(doc.querySelector("link")?.getAttribute("media")).toBeNull();
  });

  it("відносне глушиться навіть тоді, коли файл знайдено", () => {
    const doc = parse(`<html><head><link rel="stylesheet" href="style.css"></head></html>`);
    applyNeighborFiles(doc, [cssFile]);
    expect(doc.querySelector("link")?.getAttribute("media")).toBe("not all");
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
