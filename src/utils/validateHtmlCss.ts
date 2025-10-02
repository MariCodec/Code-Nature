
import type {
  HtmlCssCheck,
} from "../types/validateHtmlCss";



// Функція перевірки закриття тегів


// Перевіряє, що HTML-фрагмент валідний і всі теги закриті
export function isHtmlWellFormed(html: string): boolean {
  const stack: string[] = [];
  const tagRegex = /<\/?([a-zA-Z0-9]+)[^>]*>/g;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    if (match[0][1] !== "/") {
      // відкриваючий тег
      stack.push(tag);
    } else {
      // закриваючий тег
      if (stack.pop() !== tag) return false; // помилка
    }
  }

  return stack.length === 0; // true якщо всі теги закриті
}





// Основна функція перевірки HTML + CSS
export const validateHtmlCss = (
  html: string,
  doc: Document,
  checks: HtmlCssCheck
): boolean => {
  // Перевірка, чи HTML валідний
if (!isHtmlWellFormed(html)) return false;


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

  // Перевірка CSS
  const cssValid = checks.cssChecks
    ? checks.cssChecks.every(({ selector, property, value }) => {
        const el = doc.querySelector(selector);
        if (!el) return false;
        const style = getComputedStyle(el)[property];
        return style === value;
      })
    : true;

  return htmlValid && cssValid;
};
