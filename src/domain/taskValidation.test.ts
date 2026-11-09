// @vitest-environment happy-dom

/**
 * Тести на валідатор. Правило проєкту вимагає збігу трьох умов, і тут вони збігаються
 * повністю: це чиста функція, помилка в ній **тиха** (нічого не падає — завдання просто
 * не зараховується або зараховується дарма), а наслідок серйозний — заблокований учень
 * або фальшивий прогрес.
 *
 * Перевіряються **рішення**, а не кожна гілка: межі лічильників, «вакуумна істина»
 * на порожній множині, і те, який саме ключ отримає інтерфейс, — від нього залежить,
 * що учень прочитає.
 */

import { describe, expect, it } from "vitest";

import { checkTask } from "./taskValidation";
import type { RuleFailure } from "./taskValidation";
import type { DomTaskRules, TaskRules } from "../types/lessonTypes";

/**
 * Через `DOMParser` — тоді в документі є doctype, якого `innerHTML` дати не може.
 * `defaultView` у такого документа немає, тож обчислені стилі сюди не годяться.
 */
const parsed = (html: string): Document =>
  new DOMParser().parseFromString(html, "text/html");

/**
 * Живий документ середовища: має `defaultView`, тобто вміє рахувати стилі.
 * Саме так валідатор працюватиме й у пісочниці.
 */
const live = (html: string): Document => {
  document.documentElement.innerHTML = html;
  return document;
};

const dom = (rules: Omit<DomTaskRules, "kind">): TaskRules => ({
  kind: "dom",
  ...rules,
});

/** Перший провал — саме те, що показує інтерфейс. */
const firstFailure = (doc: Document, rules: TaskRules): RuleFailure | undefined => {
  const result = checkTask(doc, rules);
  for (const rule of result.rules) if (!rule.passed) return rule.failure;
  return undefined;
};

describe("checkTask: що не зараховується мовчки", () => {
  it("порожній набір правил НЕ зараховується — умова істинна на порожній множині", () => {
    expect(checkTask(parsed("<p>будь-що</p>"), dom({}))).toEqual({
      passed: false,
      rules: [{ passed: false, failure: { key: "rulesEmpty" } }],
    });
  });

  it("невідомий kind НЕ зараховується, а називає себе", () => {
    const quiz: TaskRules = {
      kind: "quiz",
      options: [{ id: "a", text: "а" }],
      correctOptionIds: ["a"],
      explanation: "",
    };

    expect(firstFailure(parsed("<p>x</p>"), quiz)).toEqual({
      key: "rulesUnsupported",
      kind: "quiz",
    });
  });

  it("невалідний селектор не валить перевірку, а повертає ключ", () => {
    expect(firstFailure(parsed("<p>x</p>"), dom({ selectors: [{ selector: "((" }] }))).toEqual(
      { key: "selectorInvalid", selector: "((" },
    );
  });

  it("текстове правило без жодної умови — помилка автора, не учня", () => {
    expect(firstFailure(parsed("<p>x</p>"), dom({ textContains: [{ selector: "p" }] }))).toEqual(
      { key: "ruleEmpty" },
    );
  });
});

describe("checkTask: межі лічильників", () => {
  const rules = dom({ selectors: [{ selector: "ul li", minCount: 3 }] });

  it("minCount: рівно стільки — зараховано, на один менше — ні", () => {
    expect(checkTask(parsed("<ul><li>1</li><li>2</li><li>3</li></ul>"), rules).passed).toBe(true);

    expect(firstFailure(parsed("<ul><li>1</li><li>2</li></ul>"), rules)).toEqual({
      key: "selectorTooFew",
      selector: "ul li",
      expected: 3,
      actual: 2,
    });
  });

  it("жодного елемента — це «немає», а не «замало»", () => {
    expect(firstFailure(parsed("<p>без списку</p>"), rules)).toEqual({
      key: "selectorMissing",
      selector: "ul li",
    });
  });
});

describe("checkTask: текст шукається по всіх елементах, а не в першому-ліпшому", () => {
  const html = "<p>коротко</p><p>тут значно довший текст про мій перший сайт</p>";

  it("досить одного абзацу, який задовольняє ОБИДВІ умови одночасно", () => {
    expect(
      checkTask(parsed(html), dom({ textContains: [{ selector: "p", text: "сайт", minLength: 20 }] }))
        .passed,
    ).toBe(true);
  });

  it("закороткий текст називає і потрібну довжину, і наявну", () => {
    expect(
      firstFailure(parsed("<p>мало</p>"), dom({ textContains: [{ selector: "p", minLength: 20 }] })),
    ).toEqual({ key: "textTooShort", selector: "p", expected: 20, actual: 4 });
  });
});

describe("checkTask: стилі перевіряються обчислені, а не написані", () => {
  it("зараховує, якщо хоч один елемент за селектором має потрібне значення", () => {
    const doc = live("<head><style>p { color: rgb(0, 128, 0); }</style></head><body><p>x</p></body>");

    expect(
      checkTask(doc, dom({ cssChecks: [{ selector: "p", property: "color", value: "rgb(0, 128, 0)" }] }))
        .passed,
    ).toBe(true);
  });

  it("не зійшлося — повідомляє і очікуване, і фактичне", () => {
    const doc = live("<head><style>p { color: rgb(255, 0, 0); }</style></head><body><p>x</p></body>");

    expect(
      firstFailure(doc, dom({ cssChecks: [{ selector: "p", property: "color", value: "rgb(0, 128, 0)" }] })),
    ).toEqual({
      key: "cssMismatch",
      selector: "p",
      property: "color",
      expected: "rgb(0, 128, 0)",
      actual: "rgb(255, 0, 0)",
    });
  });
});

describe("checkTask: структура документа", () => {
  const full =
    '<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>Мій перший сайт</title></head><body><h1>Привіт</h1></body></html>';

  it("цілий документ проходить усі чотири умови одразу", () => {
    const rules = dom({
      document: { hasDoctype: true, lang: "uk", title: "Мій перший сайт", charset: "utf-8" },
    });

    expect(checkTask(parsed(full), rules).passed).toBe(true);
  });

  it("doctype — єдине, чого селектором не дістати, тож має власний ключ", () => {
    const rules = dom({ document: { hasDoctype: true } });

    expect(firstFailure(parsed("<html><body><h1>x</h1></body></html>"), rules)).toEqual({
      key: "doctypeMissing",
    });
  });

  it("«не задано» і «задано інше» — різні поради, тож actual їх розрізняє", () => {
    const rules = dom({ document: { lang: "uk" } });

    expect(firstFailure(parsed("<html><body></body></html>"), rules)).toEqual({
      key: "documentMismatch",
      part: "lang",
      expected: "uk",
      actual: "",
    });

    expect(firstFailure(parsed('<html lang="en"><body></body></html>'), rules)).toEqual({
      key: "documentMismatch",
      part: "lang",
      expected: "uk",
      actual: "en",
    });
  });

  it("charset читається з оголошення, а не з characterSet документа", () => {
    const rules = dom({ document: { charset: "utf-8" } });

    // `document.characterSet` тут дорівнює UTF-8 незалежно від вмісту `<head>` —
    // саме тому правило дивиться на `<meta charset>`, інакше воно зараховувало б порожній файл.
    expect(firstFailure(parsed("<html><head></head><body></body></html>"), rules)).toEqual({
      key: "documentMismatch",
      part: "charset",
      expected: "utf-8",
      actual: "",
    });
  });

  it("порожнє правило документа — помилка автора, а не мовчазне зарахування", () => {
    expect(firstFailure(parsed(full), dom({ document: {} }))).toEqual({ key: "ruleEmpty" });
  });
});

/**
 * Нормалізація значень автора — пункт 4.8.
 *
 * **Виміряно, і це найважливіше в цьому блоці:** `happy-dom` і справжній браузер
 * нормалізують **по-різному**. Довжини він рахує (`1.5rem` → `24px`), а кольори —
 * ні: `green` лишається `green`, тоді як Chromium віддає `rgb(0, 128, 0)`.
 *
 * Тому тут перевіряється лише те, що однакове в обох: довжини й те, що пробний
 * елемент не потрапляє у вибірку. Рівність нотацій кольору (`green` ↔ `#008000`)
 * доводиться **в браузері**, і зелений тест такого доказу не дає.
 */
describe("значення автора нормалізується тим самим браузером", () => {
  it("довжина в rem звіряється з пікселями учня", () => {
    const doc = live("<head><style>p { font-size: 24px; }</style></head><body><p>x</p></body>");
    expect(
      checkTask(doc, dom({ cssChecks: [{ selector: "p", property: "font-size", value: "1.5rem" }] }))
        .passed,
    ).toBe(true);
  });

  it("різні значення не зближуються нормалізацією", () => {
    const doc = live("<head><style>p { font-size: 24px; }</style></head><body><p>x</p></body>");
    expect(
      checkTask(doc, dom({ cssChecks: [{ selector: "p", property: "font-size", value: "2rem" }] }))
        .passed,
    ).toBe(false);
  });

  it("учневі показується нотація автора, а не обчислена форма", () => {
    const doc = live("<head><style>p { font-size: 10px; }</style></head><body><p>x</p></body>");
    expect(
      firstFailure(doc, dom({ cssChecks: [{ selector: "p", property: "font-size", value: "1.5rem" }] })),
    ).toEqual({
      key: "cssMismatch",
      selector: "p",
      property: "font-size",
      expected: "1.5rem",
      actual: "10px",
    });
  });

  it("пробний елемент не потрапляє у вибірку правила", () => {
    // Нормалізація створює `<div>`; якби він лишався в документі, правило
    // «рівно два div» зараховувалось би на трьох.
    const doc = live("<body><div>a</div><div>b</div></body>");
    expect(
      checkTask(
        doc,
        dom({
          cssChecks: [{ selector: "div", property: "font-size", value: "16px" }],
          selectors: [{ selector: "div", minCount: 2 }],
        }),
      ).rules.every((rule) => rule.passed),
    ).toBe(true);
    expect(doc.querySelectorAll("div").length).toBe(2);
  });

  it("нерозбірне значення лишається дослівним і нічого не зараховує", () => {
    const doc = live("<head><style>p { color: red; }</style></head><body><p>x</p></body>");
    expect(
      checkTask(doc, dom({ cssChecks: [{ selector: "p", property: "color", value: "не-колір" }] }))
        .passed,
    ).toBe(false);
  });
});

/**
 * Відносні одиниці рахуються від **контексту елемента**. Знахідка `/code-review`:
 * перша реалізація нормалізувала на `div` у `<body>`, і виміряно в браузері,
 * що `padding-left: 1em` дає там 15px, а на абзаці з `font-size: 20px` — 20px.
 * Тобто правило ставало непрохідним для всіх — рівно те, проти чого нормалізація.
 */
describe("нормалізація бере контекст самого елемента", () => {
  it("em рахується від шрифту елемента, а не від чужого", () => {
    const doc = live(
      "<head><style>p { font-size: 20px; padding-left: 1em; }</style></head>" +
        "<body><p>x</p></body>",
    );
    expect(
      checkTask(doc, dom({ cssChecks: [{ selector: "p", property: "padding-left", value: "1em" }] }))
        .passed,
    ).toBe(true);
  });

  it("проба не лишається в документі", () => {
    const doc = live("<body><p>x</p></body>");
    checkTask(doc, dom({ cssChecks: [{ selector: "p", property: "font-size", value: "1em" }] }));
    expect(doc.querySelectorAll("p").length).toBe(1);
  });
});
