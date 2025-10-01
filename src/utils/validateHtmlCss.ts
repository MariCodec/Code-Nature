// utils/validateHtmlCss.ts
interface CssCheck {
  selector: string;
  property: keyof CSSStyleDeclaration;
  value: string;
}

interface HtmlCssCheck {
  htmlSelectors: { selector: string; next?: string }[]; // селектор і наступний тег (для перевірки порядку)
  cssChecks?: CssCheck[];
}

export const validateHtmlCss = (
  doc: Document,
  checks: HtmlCssCheck
): boolean => {
  // Перевірка HTML
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
