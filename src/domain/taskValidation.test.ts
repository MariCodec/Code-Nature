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
