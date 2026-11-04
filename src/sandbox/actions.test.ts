// @vitest-environment happy-dom

/**
 * Три умови правила тестів збігаються: функція маленька й передбачувана, помилка
 * **тиха** (дія просто не сталась, сторінка жива), а наслідок найдорожчий —
 * завдання стає непрохідним **для всіх**, і учень шукає помилку в себе.
 */

import { describe, expect, it } from "vitest";

import { performActions } from "./actions";

const page = (html: string) => {
  document.body.innerHTML = html;
  return document;
};

describe("дії перед перевіркою", () => {
  it("клік доходить до слухача учня", () => {
    const doc = page(`<button id="greet">Кнопка</button><p id="out"></p>`);
    doc.querySelector("#greet")?.addEventListener("click", () => {
      doc.querySelector("#out")!.textContent = "Привіт!";
    });

    expect(performActions(doc, [{ kind: "click", selector: "#greet" }])).toBeNull();
    expect(doc.querySelector("#out")?.textContent).toBe("Привіт!");
  });

  it("дії виконуються по порядку й кожна окремо", () => {
    const doc = page(`<button id="greet">Кнопка</button><span id="count">0</span>`);
    let clicks = 0;
    doc.querySelector("#greet")?.addEventListener("click", () => {
      clicks += 1;
      doc.querySelector("#count")!.textContent = String(clicks);
    });

    performActions(doc, [
      { kind: "click", selector: "#greet" },
      { kind: "click", selector: "#greet" },
      { kind: "click", selector: "#greet" },
    ]);

    expect(doc.querySelector("#count")?.textContent).toBe("3");
  });

  it("немає куди клікнути — повертається селектор, а не мовчазний успіх", () => {
    const doc = page(`<p>нічого</p>`);
    expect(performActions(doc, [{ kind: "click", selector: "#greet" }])).toEqual({
      reason: "missing",
      selector: "#greet",
    });
  });

  it("перша невдача зупиняє решту: учневі треба перша причина, не остання", () => {
    const doc = page(`<button id="second">друга</button>`);
    let clicked = false;
    doc.querySelector("#second")?.addEventListener("click", () => {
      clicked = true;
    });

    const failure = performActions(doc, [
      { kind: "click", selector: "#first" },
      { kind: "click", selector: "#second" },
    ]);

    expect(failure).toEqual({ reason: "missing", selector: "#first" });
    expect(clicked).toBe(false);
  });

  it("порожній список дій нічого не ламає", () => {
    expect(performActions(page(`<p>x</p>`), [])).toBeNull();
  });

  it("введення тексту доходить і як значення, і як подія", () => {
    const doc = page(`<input id="name" /><p id="out"></p>`);
    const seen: string[] = [];
    doc.querySelector("#name")?.addEventListener("input", (event) => {
      seen.push((event.target as HTMLInputElement).value);
    });

    performActions(doc, [{ kind: "type", selector: "#name", text: "Оля" }]);

    expect((doc.querySelector("#name") as HTMLInputElement).value).toBe("Оля");
    // Подія потрібна окремо: без неї урок «реагуй, поки людина друкує»
    // був би неперевірним, хоч значення й стояло б на місці.
    expect(seen).toEqual(["Оля"]);
  });

  it("введення замінює те, що було в полі", () => {
    const doc = page(`<input id="name" value="старе" />`);
    performActions(doc, [{ kind: "type", selector: "#name", text: "нове" }]);
    expect((doc.querySelector("#name") as HTMLInputElement).value).toBe("нове");
  });

  it("писати не в поле — помилка автора, і вона своя", () => {
    const doc = page(`<p id="name">не поле</p>`);
    expect(performActions(doc, [{ kind: "type", selector: "#name", text: "Оля" }])).toEqual({
      reason: "notTypeable",
      selector: "#name",
    });
  });
});
