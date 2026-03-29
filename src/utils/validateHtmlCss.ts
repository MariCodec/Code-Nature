
import type {
  HtmlCssCheck,
} from "../types/validateHtmlCss";


// Основна функція перевірки HTML + CSS
export const validateHtmlCss = (
  doc: Document,
  checks: HtmlCssCheck
): boolean => {
  // Перевірка HTML селекторів
  const htmlValid = checks.htmlSelectors.every(({ selector, next }) => {
    const el = doc.querySelector(selector);
    if (!el) return false;
    if (next) {
      const nextEl = el.nextElementSibling;
      if (!nextEl || nextEl.tagName.toLowerCase() !== next.toLowerCase())
        return false;
    }
    return true;
  });

  const textValid = checks.requireTextContains
    ? checks.requireTextContains.every(({ selector, text }) => {
        const el = doc.querySelector(selector);
        if (!el) return false;
        return el.textContent?.includes(text) ?? false;
      })
    : true;

  // Перевірка CSS
  const cssValid = checks.cssChecks
    ? checks.cssChecks.every(({ selector, property, value }) => {
        const el = doc.querySelector(selector);
        if (!el) return false;
        const style = getComputedStyle(el).getPropertyValue(property).trim();
        return style === value;
      })
    : true;

  return htmlValid && textValid && cssValid;
};
