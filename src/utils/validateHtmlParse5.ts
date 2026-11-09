// src/utils/validateHtmlParse5.ts
import type * as monaco from "monaco-editor";
import * as parse5 from "parse5";

type Parse5Error = {
  code?: string;
  msg?: string;
  startLine?: number;
  startCol?: number;
  startOffset?: number;
  endLine?: number;
  endCol?: number;
  endOffset?: number;
};

const toMessage = (e: Parse5Error) =>
  e.msg || e.code || "HTML помилка парсингу";

const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

type TagLocation = {
  startLine?: number;
  startCol?: number;
  endLine?: number;
  endCol?: number;
};

type SourceCodeLocation = {
  startTag?: TagLocation;
  endTag?: TagLocation;
};

type HtmlAstNode = {
  nodeName?: string;
  tagName?: string;
  childNodes?: HtmlAstNode[];
  content?: { childNodes?: HtmlAstNode[] };
  sourceCodeLocation?: SourceCodeLocation;
};

function collectUnclosedElements(
  node: HtmlAstNode | null | undefined,
  out: HtmlAstNode[] = [],
): HtmlAstNode[] {
  if (!node) return out;

  const tagName = node.tagName ? String(node.tagName).toLowerCase() : null;
  const loc = node.sourceCodeLocation;

  const hasStart = !!loc?.startTag;
  const hasEnd = !!loc?.endTag;

  if (tagName && hasStart && !hasEnd && !VOID_TAGS.has(tagName)) {
    out.push(node);
  }

  const children = node.childNodes ?? node.content?.childNodes ?? [];
  for (const ch of children) collectUnclosedElements(ch, out);

  return out;
}

export function validateHtmlWithParse5(
  monacoInstance: typeof monaco,
  model: monaco.editor.ITextModel,
  html: string,
): { hasErrors: boolean; firstMessage: string | null } {
  const errors: Parse5Error[] = [];

  const ast = parse5.parse(html, {
    sourceCodeLocationInfo: true,
    onParseError: (err: unknown) => {
      const e = err as Parse5Error;
      if (e?.code === "missing-doctype") return;
      errors.push(e);
    },
  }) as unknown as HtmlAstNode;

  const markers: monaco.editor.IMarkerData[] = errors.map((e) => {
    const startLineNumber = e.startLine ?? 1;
    const startColumn = e.startCol ?? 1;

    const endLineNumber = e.endLine ?? startLineNumber;
    const endColumn = e.endCol ?? Math.min(startColumn + 1, 1_000_000);

    return {
      severity: monacoInstance.MarkerSeverity.Error,
      message: toMessage(e),
      startLineNumber,
      startColumn,
      endLineNumber,
      endColumn,
    };
  });

  // Додатково: незакритий тег (коли parse5 не дав parse error)
  const unclosed = collectUnclosedElements(ast);
  const last = unclosed[unclosed.length - 1];

  const tag = last?.tagName ? String(last.tagName).toLowerCase() : null;
  const st = last?.sourceCodeLocation?.startTag;

  if (tag && st?.startLine && st?.startCol) {
  const endCol = st.endCol ?? st.startCol + `<${tag}>`.length;

  markers.push({
    severity: monacoInstance.MarkerSeverity.Error,
    message: `Тег <${tag}> не закритий — додайте </${tag}>`,
    startLineNumber: st.startLine,
    startColumn: st.startCol,
    endLineNumber: st.startLine,
    endColumn: endCol,
  });
  }

  monacoInstance.editor.setModelMarkers(model, "html-parse5", markers);

  return {
    hasErrors: markers.length > 0,
    firstMessage: markers[0]?.message ?? null,
  };
}
