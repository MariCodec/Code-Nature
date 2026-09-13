/**
 * Складає український текст із ключа, який повернув валідатор.
 *
 * Живе в `i18n`, а не в домені: валідатор вирішує, **що** не зійшлося, мова —
 * справа інтерфейсу. Той самий поділ, що між `techCheck.getFeedbackKey` і `uk.techCheck`.
 */

import type { RuleFailure } from "../domain/taskValidation";
import { uk } from "./uk";

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
