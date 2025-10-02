export interface HtmlSelectorCheck {
  selector: string;
  next?: string;
}

export interface CssCheck {
  selector: string;
  property: keyof CSSStyleDeclaration;
  value: string;
}

export interface HtmlCssCheck {
  htmlSelectors: HtmlSelectorCheck[];
  cssChecks?: CssCheck[];
}
