export interface HtmlSelectorCheck {
  selector: string;
  next?: string;
}

export interface CssCheck {
  selector: string;
  property: string;
  value: string;
}

export interface HtmlCssCheck {
  htmlSelectors: HtmlSelectorCheck[];
  cssChecks?: CssCheck[];
  requireTextContains?: { selector: string; text: string }[];
}
