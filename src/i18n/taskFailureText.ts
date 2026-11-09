/**
 * Складає український текст із ключа, який повернув валідатор.
 *
 * Живе в `i18n`, а не в домені: валідатор вирішує, **що** не зійшлося, мова —
 * справа інтерфейсу. Той самий поділ, що між `techCheck.getFeedbackKey` і `uk.techCheck`.
 */

import type { RuleFailure } from "../domain/taskValidation";
import { uk } from "./uk";

/** Кожна частина документа має власне речення — спільне вийшло б надто загальним. */
function getDocumentMismatchText(
  part: "lang" | "title" | "charset",
  expected: string,
  actual: string,
): string {
  const t = uk.taskCheck;

  switch (part) {
    case "lang":
      return t.langMismatch(expected, actual);
    case "title":
      return t.titleMismatch(expected, actual);
    case "charset":
      return t.charsetMismatch(expected, actual);
  }
}

export function getTaskFailureText(failure: RuleFailure): string {
  const t = uk.taskCheck;

  switch (failure.key) {
    case "selectorMissing":
      return t.selectorMissing(failure.selector);
    case "selectorTooFew":
      return t.selectorTooFew(failure.selector, failure.expected, failure.actual);
    case "selectorInvalid":
      return t.selectorInvalid(failure.selector);
    case "textMismatch":
      return t.textMismatch(failure.selector, failure.expected);
    case "textTooShort":
      return t.textTooShort(failure.selector, failure.expected);
    case "cssMismatch":
      return t.cssMismatch(
        failure.selector,
        failure.property,
        failure.expected,
        failure.actual,
      );
    case "doctypeMissing":
      return t.doctypeMissing;
    case "documentMismatch":
      return getDocumentMismatchText(failure.part, failure.expected, failure.actual);
    case "actTargetMissing":
      return t.actTargetMissing(failure.selector);
    case "actTargetNotTypeable":
      return t.actTargetNotTypeable(failure.selector);
    case "actTargetNotClickable":
      return t.actTargetNotClickable(failure.selector);
    case "ruleEmpty":
      return t.ruleEmpty;
    case "rulesEmpty":
      return t.rulesEmpty;
    case "rulesUnsupported":
      return t.rulesUnsupported(failure.kind);
  }
}

/** Перше правило, яке не зійшлося. Показуємо по одному: список провалів лякає. */
export function getFirstFailureText(
  rules: readonly { passed: boolean; failure?: RuleFailure }[],
): string | null {
  const first = rules.find((rule) => !rule.passed);
  return first?.failure ? getTaskFailureText(first.failure) : null;
}
