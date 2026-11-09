import { describe, expect, it } from "vitest";
import { parseInline, parseLines } from "./inlineMarkdown";

describe("parseInline", () => {
  it("виділяє код і жирний, решту лишає текстом", () => {
    expect(parseInline("тег `<h1>` це **важливо**")).toEqual([
      { type: "text", value: "тег " },
      { type: "code", value: "<h1>" },
      { type: "text", value: " це " },
      { type: "bold", value: "важливо" },
    ]);
  });

  it("не ламається на непарних лапках", () => {
    expect(parseInline("незакритий ` бек-тік")).toEqual([
      { type: "text", value: "незакритий ` бек-тік" },
    ]);
  });

  it("HTML лишається текстом, а не розміткою", () => {
    // Токен несе рядок; React рендерить його як текст, вставки розмітки немає
    expect(parseInline("<script>x</script>")).toEqual([
      { type: "text", value: "<script>x</script>" },
    ]);
  });
});

describe("parseLines", () => {
  it("розпізнає пункти списку", () => {
    const lines = parseLines("Зроби так:\n- перший\n- другий");
    expect(lines.map((l) => l.isBullet)).toEqual([false, true, true]);
    expect(lines[1].tokens).toEqual([{ type: "text", value: "перший" }]);
  });
});
