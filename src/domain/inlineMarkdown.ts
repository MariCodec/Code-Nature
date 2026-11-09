/**
 * Мінімальний інлайн-markdown для навчального контенту.
 *
 * Свідомо вузький набір: жирний і код. Жодного HTML і жодних посилань —
 * це контент, який згодом редагуватиметься через адмінку, і він не має
 * ставати вектором вставки розмітки.
 */

export type InlineToken =
  | { type: "text"; value: string }
  | { type: "code"; value: string }
  | { type: "bold"; value: string };

const PATTERN = /(`[^`\n]+`|\*\*[^*\n]+\*\*)/g;

export function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(PATTERN)) {
    const index = match.index ?? 0;

    if (index > lastIndex) {
      tokens.push({ type: "text", value: text.slice(lastIndex, index) });
    }

    const raw = match[0];
    tokens.push(
      raw.startsWith("`")
        ? { type: "code", value: raw.slice(1, -1) }
        : { type: "bold", value: raw.slice(2, -2) },
    );

    lastIndex = index + raw.length;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: "text", value: text.slice(lastIndex) });
  }

  return tokens;
}

export type MarkdownLine = {
  /** Рядок списку, якщо починався з «- ». */
  isBullet: boolean;
  tokens: InlineToken[];
};

export function parseLines(text: string): MarkdownLine[] {
  return text.split("\n").map((line) => {
    const trimmed = line.trimStart();
    const isBullet = trimmed.startsWith("- ");

    return {
      isBullet,
      tokens: parseInline(isBullet ? trimmed.slice(2) : line),
    };
  });
}
