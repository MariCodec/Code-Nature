/**
 * Валідатор завдання: чиста функція над документом і правилами.
 *
 * Дві вимоги, обидві — про форму, і обидві не ретрофітяться (PLATFORM_UA, розділ 5):
 *
 * 1. **Без диспатчу.** Нічого не знає про Redux, про урок і про те, чим він
 *    закінчиться. Отримує документ і правила, повертає результат. Саме тому
 *    у Фазі 3 він переїде всередину агента пісочниці незміненим — йому байдуже,
 *    звідки взявся `Document`.
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
  /** Правило без жодної умови — теж помилка автора. */
  | { key: "ruleEmpty" }
  /** У завдання немає жодного правила. */
  | { key: "rulesEmpty" }
  /** `kind`, якого цей валідатор не вміє: quiz, js-test, output, manual. */
  | { key: "rulesUnsupported"; kind: string };

export type RuleResult = { passed: true } | { passed: false; failure: RuleFailure };

export type TaskCheck = {
  passed: boolean;
  /** Результат по кожному правилу, у порядку: селектори → текст → стилі. */
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
 * `doc.defaultView`, а не глобальний `getComputedStyle`: документ приїжджає ззовні
 * — з iframe зараз, із пісочниці у Фазі 3, — і рахувати його стилі вікном застосунку
 * було б випадковістю, яка одного дня перестане працювати.
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

function checkDomRules(doc: Document, rules: DomTaskRules): TaskCheck {
  const results = [
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
