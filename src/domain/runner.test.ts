import { describe, expect, it } from "vitest";
import { isRunnerEvent } from "./runner";

/**
 * Гвард форми — чиста функція, помилка в ній тиха (підроблене повідомлення
 * проходить далі й кладе застосунок там, де тип уже звужений), наслідок серйозний.
 * Три умови правила тестів збігаються.
 */
describe("isRunnerEvent", () => {
  it("пропускає відомі повідомлення", () => {
    expect(isRunnerEvent({ type: "ready" })).toBe(true);
    expect(isRunnerEvent({ type: "result", checkId: "c1", results: [] })).toBe(true);
    expect(isRunnerEvent({ type: "timeout", checkId: "c1" })).toBe(true);
    expect(isRunnerEvent({ type: "console", level: "warn", args: ["x"] })).toBe(true);
    expect(isRunnerEvent({ type: "runtime-error", message: "boom" })).toBe(true);
  });

  it("відкидає чуже й покручене", () => {
    // У обробник postMessage може прилетіти будь-що зі стороннього вікна
    expect(isRunnerEvent({ type: "definitely-not-ours" })).toBe(false);
    expect(isRunnerEvent("ready")).toBe(false);
    expect(isRunnerEvent(null)).toBe(false);
  });

  /**
   * Пісочниця виконує код учня, тож підроблене повідомлення — не гіпотеза.
   * Тег у всіх цих випадках правильний: ловить саме перевірка форми.
   */
  it("відкидає правильний тег із неправильним вмістом", () => {
    expect(isRunnerEvent({ type: "result", checkId: "c1" })).toBe(false);
    expect(isRunnerEvent({ type: "result", results: [] })).toBe(false);
    expect(
      isRunnerEvent({ type: "result", checkId: "c1", results: [{ taskId: "t1" }] }),
    ).toBe(false);
    expect(isRunnerEvent({ type: "console", level: "trace", args: [] })).toBe(false);
    expect(isRunnerEvent({ type: "console", level: "log", args: "рядок" })).toBe(false);
    expect(isRunnerEvent({ type: "timeout" })).toBe(false);
    expect(isRunnerEvent({ type: "runtime-error" })).toBe(false);
  });

  /**
   * `passed: false` без `failure` — саме та форма, на якій падає складання
   * тексту учневі: читач звузив тип по `passed` і читає `failure.key`.
   */
  it("відкидає результат правила без причини провалу", () => {
    const withBrokenRule = {
      type: "result",
      checkId: "c1",
      results: [{ taskId: "t1", passed: false, rules: [{ passed: false }] }],
    };
    expect(isRunnerEvent(withBrokenRule)).toBe(false);

    const withKey = {
      type: "result",
      checkId: "c1",
      results: [
        {
          taskId: "t1",
          passed: false,
          rules: [{ passed: false, failure: { key: "selectorMissing", selector: "h1" } }],
        },
      ],
    };
    expect(isRunnerEvent(withKey)).toBe(true);
  });
});
