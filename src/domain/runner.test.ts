import { describe, expect, it } from "vitest";
import { isRunnerEvent } from "./runner";

describe("isRunnerEvent", () => {
  it("пропускає відомі повідомлення", () => {
    expect(isRunnerEvent({ type: "ready" })).toBe(true);
    expect(isRunnerEvent({ type: "result", checkId: "c1", results: [] })).toBe(true);
  });

  it("відкидає чуже й покручене", () => {
    // У обробник postMessage може прилетіти будь-що зі стороннього вікна
    expect(isRunnerEvent({ type: "definitely-not-ours" })).toBe(false);
    expect(isRunnerEvent("ready")).toBe(false);
    expect(isRunnerEvent(null)).toBe(false);
  });
});
