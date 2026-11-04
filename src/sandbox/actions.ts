/**
 * Дії перевірки над сторінкою учня.
 *
 * Живе в `sandbox/`, а не в `domain/`, і це не дрібниця розкладки: домен тримає
 * **чисті** функції, а тут побічний ефект за визначенням — ми змінюємо документ.
 * Валідатор від цього лишається чистим: до моменту, коли його кличуть, дії вже
 * сталися, і він, як і раніше, просто дивиться на DOM.
 *
 * Чому дії взагалі окремо від правил: правило відповідає на «що має бути»,
 * дія — на «що для цього зробити». Склеївши їх, ми отримали б правило, яке
 * саме себе готує, і перевірити таке на сервері окремо від сторінки було б
 * неможливо (PLATFORM_UA, розділ 8).
 */

import type { DomAction } from "../types/lessonTypes";

/**
 * Чому дію не вдалося виконати. Обидві причини — помилка **автора уроку**,
 * тож і повідомлення учневі будуть різні: «немає такого елемента» і «в цей
 * елемент не можна писати» ведуть у різні боки.
 */
export type ActionFailure = {
  reason: "missing" | "notTypeable";
  selector: string;
};

const isTypeable = (element: Element): element is HTMLInputElement | HTMLTextAreaElement =>
  element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement;

/**
 * Вводить текст так, як це робить користувач: значення **замінюється** цілком,
 * і за ним летить подія `input`.
 *
 * Без події урок «показуй підказку, поки людина друкує» був би неперевірним:
 * учень слухає `input`, а ми б мовчки присвоїли `value`. Подія `change` іде
 * слідом, бо саме її чекають ті, хто звик до форм.
 */
const typeInto = (element: HTMLInputElement | HTMLTextAreaElement, text: string) => {
  element.value = text;
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
};

/**
 * Виконує дії по порядку. Перша ж невдача зупиняє: якщо кнопки немає, решта
 * дій однаково безглузда, а учневі треба назвати **першу** причину, а не останню.
 *
 * `click()` — не `dispatchEvent(new MouseEvent("click"))`. Різниця не косметична:
 * нативний метод проходить повний шлях браузера, тобто спрацьовує й на `<label>`,
 * і на кнопці всередині форми. Синтетична подія лише сповістила б слухачів.
 */
export const performActions = (
  doc: Document,
  actions: DomAction[],
): ActionFailure | null => {
  for (const action of actions) {
    const element = doc.querySelector(action.selector);
    if (!element) return { reason: "missing", selector: action.selector };

    switch (action.kind) {
      case "click":
        (element as HTMLElement).click();
        break;
      case "type":
        if (!isTypeable(element))
          return { reason: "notTypeable", selector: action.selector };
        typeInto(element, action.text);
        break;
    }
  }

  return null;
};
