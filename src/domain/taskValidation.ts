/**
 * Валідатор завдання: чиста функція над документом і правилами.
 *
 * Дві вимоги, обидві — про форму, і обидві не ретрофітяться (PLATFORM_UA, розділ 5):
 *
 * 1. **Без диспатчу.** Нічого не знає про Redux, про урок і про те, чим він
 *    закінчиться. Отримує документ і правила, повертає результат. Саме тому
 *    саме тому він і переїхав усередину агента пісочниці незміненим — йому
 *    байдуже, звідки взявся `Document`.
 * 2. **Результат по кожному правилу.** Один булеан на завдання не дає чим заповнити
 *    повідомлення учневі: треба не «не зараховано», а «`<h1>` є, але колір не зелений».
 *
 * Рядків тут немає навмисно: домен вирішує, **який** текст показати, а сам текст
 * живе в `i18n/uk.ts` — той самий поділ, що в `techCheck.getFeedbackKey`.
 *
 * Правило, яке не впізнали, і порожній набір правил **не зараховуються**. Умова
 * «всі правила пройшли» істинна на порожній множині, тож поблажливий валідатор
 * тихо зарахував би завдання, до якого ніхто не написав перевірки.
 */

import type {
  CssRule,
  DocumentRule,
  DomTaskRules,
  SelectorRule,
  TaskRules,
  TextRule,
} from "../types/lessonTypes";

export type RuleFailure =
  /** Жодного елемента за селектором. */
  | { key: "selectorMissing"; selector: string }
  /** Елементи є, але їх менше, ніж вимагає `minCount`. */
  | { key: "selectorTooFew"; selector: string; expected: number; actual: number }
  /** Селектор не розібрався — помилка автора уроку, не учня. */
  | { key: "selectorInvalid"; selector: string }
  | { key: "textMismatch"; selector: string; expected: string }
  | { key: "textTooShort"; selector: string; expected: number; actual: number }
  | {
      key: "cssMismatch";
      selector: string;
      property: string;
      expected: string;
      actual: string;
    }
  /** Немає `<!doctype html>`. Окремий ключ, бо doctype не елемент. */
  | { key: "doctypeMissing" }
  /**
   * Частина документа є, але не та. `actual: ""` означає «не задано взагалі» —
   * інтерфейс розрізняє ці два випадки текстом, як уже робить для `cssMismatch`.
   */
  | {
      key: "documentMismatch";
      part: "lang" | "title" | "charset";
      expected: string;
      actual: string;
    }
  /** Правило без жодної умови — теж помилка автора. */
  | { key: "ruleEmpty" }
  /** У завдання немає жодного правила. */
  | { key: "rulesEmpty" }
  /** `kind`, якого цей валідатор не вміє: quiz, js-test, output, manual. */
  | { key: "rulesUnsupported"; kind: string };

export type RuleResult = { passed: true } | { passed: false; failure: RuleFailure };

export type TaskCheck = {
  passed: boolean;
  /** Результат по кожному правилу, у порядку: документ → селектори → текст → стилі. */
  rules: RuleResult[];
};

const PASSED: RuleResult = { passed: true };
const failed = (failure: RuleFailure): RuleResult => ({ passed: false, failure });

/** `null` — селектор невалідний. Порожній масив — валідний, але нічого не знайшов. */
const queryAll = (doc: Document, selector: string): Element[] | null => {
  try {
    return Array.from(doc.querySelectorAll(selector));
  } catch {
    return null;
  }
};

const textOf = (element: Element) => (element.textContent ?? "").trim();

function checkSelectorRule(doc: Document, rule: SelectorRule): RuleResult {
  const found = queryAll(doc, rule.selector);
  if (!found) return failed({ key: "selectorInvalid", selector: rule.selector });

  const expected = rule.minCount ?? 1;
  if (found.length === 0)
    return failed({ key: "selectorMissing", selector: rule.selector });
  if (found.length < expected)
    return failed({
      key: "selectorTooFew",
      selector: rule.selector,
      expected,
      actual: found.length,
    });

  return PASSED;
}

/**
 * Досить одного елемента, який задовольняє **обидві** умови правила.
 * Не першого-ліпшого: завдання «додай абзац, у якому розкажи про сайт» виконане,
 * якщо такий абзац є, а не якщо він трапився першим у документі.
 */
function checkTextRule(doc: Document, rule: TextRule): RuleResult {
  if (rule.text === undefined && rule.minLength === undefined)
    return failed({ key: "ruleEmpty" });

  const found = queryAll(doc, rule.selector);
  if (!found) return failed({ key: "selectorInvalid", selector: rule.selector });
  if (found.length === 0)
    return failed({ key: "selectorMissing", selector: rule.selector });

  const texts = found.map(textOf);
  const withText =
    rule.text === undefined
      ? texts
      : texts.filter((text) => text.includes(rule.text as string));

  if (withText.length === 0)
    return failed({
      key: "textMismatch",
      selector: rule.selector,
      expected: rule.text as string,
    });

  if (rule.minLength === undefined) return PASSED;

  const longest = Math.max(...withText.map((text) => text.length));
  return longest >= rule.minLength
    ? PASSED
    : failed({
        key: "textTooShort",
        selector: rule.selector,
        expected: rule.minLength,
        actual: longest,
      });
}

/**
 * Перевіряється **обчислений** стиль, а не написаний у CSS: учень міг задати колір
 * будь-яким селектором, важливий результат.
 *
 * `doc.defaultView`, а не глобальний `getComputedStyle`: документ належить вікну
 * пісочниці, а не застосунку, і рахувати його стилі чужим вікном було б
 * випадковістю, яка одного дня перестане працювати.
 */
function checkCssRule(doc: Document, rule: CssRule): RuleResult {
  const found = queryAll(doc, rule.selector);
  if (!found) return failed({ key: "selectorInvalid", selector: rule.selector });
  if (found.length === 0)
    return failed({ key: "selectorMissing", selector: rule.selector });

  const view = doc.defaultView;
  let actual = "";

  for (const element of found) {
    const value = view
      ? view.getComputedStyle(element).getPropertyValue(rule.property).trim()
      : "";
    if (value === rule.value) return PASSED;
    if (!actual) actual = value;
  }

  return failed({
    key: "cssMismatch",
    selector: rule.selector,
    property: rule.property,
    expected: rule.value,
    actual,
  });
}

/**
 * Повертає **список** результатів, а не один: у правилі може бути до чотирьох
 * незалежних умов, і учневі треба знати, яка саме не зійшлася.
 *
 * Порожній обʼєкт (чи сам лише `hasDoctype: false`) — помилка автора, як і
 * порожнє текстове правило.
 */
function checkDocumentRule(doc: Document, rule: DocumentRule): RuleResult[] {
  const results: RuleResult[] = [];

  const compare = (
    part: "lang" | "title" | "charset",
    expected: string,
    actual: string,
    caseSensitive = false,
  ) => {
    const same = caseSensitive
      ? actual === expected
      : actual.toLowerCase() === expected.toLowerCase();
    results.push(same ? PASSED : failed({ key: "documentMismatch", part, expected, actual }));
  };

  if (rule.hasDoctype) {
    const doctype = doc.doctype;
    results.push(
      doctype && doctype.name.toLowerCase() === "html"
        ? PASSED
        : failed({ key: "doctypeMissing" }),
    );
  }

  if (rule.lang !== undefined)
    compare("lang", rule.lang, doc.documentElement?.getAttribute("lang")?.trim() ?? "");

  if (rule.title !== undefined)
    compare(
      "title",
      rule.title,
      (doc.querySelector("head > title")?.textContent ?? "").trim(),
      true,
    );

  if (rule.charset !== undefined) {
    /**
     * Читається оголошення, а не `document.characterSet`. У `srcdoc`-iframe документ
     * успадковує кодування батьківської сторінки, тож `characterSet` показував би
     * UTF-8 незалежно від того, що написав учень, — тобто завдання зараховувалось би
     * порожнім файлом.
     */
    const meta = doc.querySelector("head meta[charset]");
    compare("charset", rule.charset, meta?.getAttribute("charset")?.trim() ?? "");
  }

  return results.length > 0 ? results : [failed({ key: "ruleEmpty" })];
}

function checkDomRules(doc: Document, rules: DomTaskRules): TaskCheck {
  const results = [
    ...(rules.document ? checkDocumentRule(doc, rules.document) : []),
    ...(rules.selectors ?? []).map((rule) => checkSelectorRule(doc, rule)),
    ...(rules.textContains ?? []).map((rule) => checkTextRule(doc, rule)),
    ...(rules.cssChecks ?? []).map((rule) => checkCssRule(doc, rule)),
  ];

  if (results.length === 0)
    return { passed: false, rules: [failed({ key: "rulesEmpty" })] };

  return { passed: results.every((result) => result.passed), rules: results };
}

/**
 * Питання техчека сюди не потрапляють: відповідь на них не в документі, а в тому,
 * що обрав учень. Викликач їх відфільтровує; якщо забуде — завдання не зарахується
 * гучно, а не пройде тихо.
 */
export function checkTask(doc: Document, rules: TaskRules): TaskCheck {
  if (rules.kind !== "dom")
    return {
      passed: false,
      rules: [failed({ key: "rulesUnsupported", kind: rules.kind })],
    };

  return checkDomRules(doc, rules);
}
