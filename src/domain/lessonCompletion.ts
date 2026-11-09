/**
 * Коли урок вважається завершеним.
 *
 * Правило залежить від `validationType` і від нічого іншого — див. PLATFORM_UA,
 * розділ 3. Це не дрібниця: за спільним правилом «усі завдання виконано» урок
 * **без** завдань завершується в момент відкриття, бо умова істинна на порожній
 * множині. Саме цю дірку знайшли чотири пробні уроки Фази 0.
 *
 * Чиста функція без React і Redux — як `progression` і `techCheck`. Форма стану
 * прогресу зміниться у Фазі 6, спосіб запускати перевірку — у Фазі 3; це правило
 * переживе обидві.
 */

import type { LessonValidationType } from "../types/content";

export type LessonCompletionInput = {
  validationType: LessonValidationType;
  tasks: readonly { id: string }[];
  /** Зараховані завдання саме цього уроку. */
  taskStatus: Record<string, boolean> | undefined;
  /** Явна дія учня — там, де перевіряти нічого. */
  isMarkedDone: boolean;
};

export type LessonCompletion =
  | { completed: true }
  | {
      completed: false;
      /**
       * `noRule` — помилка контенту: урок обіцяє автоперевірку, але завдань немає.
       * Решта — нормальні стани, у яких учень ще чогось не зробив.
       */
      blockedBy: "tasks" | "confirmation" | "teacher" | "noRule";
    };

const DONE: LessonCompletion = { completed: true };

export function getLessonCompletion(input: LessonCompletionInput): LessonCompletion {
  switch (input.validationType) {
    case "auto": {
      // Не `every` по порожньому масиву: урок із `auto` і нулем завдань — це
      // недописаний контент, а не пройдений урок.
      if (input.tasks.length === 0) return { completed: false, blockedBy: "noRule" };

      const allDone = input.tasks.every((task) => Boolean(input.taskStatus?.[task.id]));
      return allDone ? DONE : { completed: false, blockedBy: "tasks" };
    }

    case "none":
      /**
       * Лишилась **одна** відповідь — явна дія учня, і гілки з обовʼязковим
       * відео тут більше немає (розділ 3).
       *
       * Знята вона не заради спрощення. Виконати «додивлене до кінця» можна було
       * лише для файлового плеєра: YouTube і Vimeo в айфреймі про кінець не
       * повідомляють без власних API. Тобто правило було правдою для одного
       * випадку й обіцянкою для решти — а «додивився» тим часом проставлявся
       * кліком «далі», у тому числі на уроці, чиє відео взагалі не існувало.
       *
       * Замість нагляду, який неможливо добудувати, відповідальність віддана
       * учневі: це самонавчання без викладача й без сертифіката, тож проминуте
       * відео обманює лише того, хто його проминув. Той самий принцип, що
       * з передумовами курсу — попереджаємо, не перекриваємо.
       */
      return input.isMarkedDone ? DONE : { completed: false, blockedBy: "confirmation" };

    case "manual":
      // Викладача в MVP немає, тож підтвердити нікому — див. розділ 2.
      return { completed: false, blockedBy: "teacher" };
  }
}

export const isLessonComplete = (input: LessonCompletionInput): boolean =>
  getLessonCompletion(input).completed;
