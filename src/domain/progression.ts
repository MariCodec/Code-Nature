/**
 * Логіка проходження модуля: що відкрито, що завершено, що далі.
 *
 * Чисті функції без Redux, React і мережі — саме тому їх можна тестувати
 * і саме тому вони переживуть зміну форми стану в наступних фазах.
 *
 * Головне правило: позиція техчека визначається `lessonKind`, а не `orderIndex`.
 * Техчек завжди останній у модулі, яке б число не стояло в даних.
 */

import type { LessonListItemDTO } from "../types/content";

export type ModuleItem = Pick<
  LessonListItemDTO,
  "id" | "courseId" | "moduleId" | "lessonKind" | "orderIndex" | "title"
>;

export type ModuleContext = {
  /** Уроки й техчек одного модуля, у будь-якому порядку. */
  items: ModuleItem[];
  /** Id завершених уроків і техчеків. */
  completedIds: ReadonlySet<string>;
  /** Наступний модуль курсу; null — якщо цей модуль останній. */
  nextModuleId: string | null;
};

export type ModuleState = {
  /** Звичайні уроки, впорядковані за orderIndex. */
  lessons: ModuleItem[];
  /** Техчек модуля, якщо він є. */
  techCheck: ModuleItem | null;
  /** Уроки + техчек у порядку проходження. */
  ordered: ModuleItem[];
  completedLessonsCount: number;
  totalLessonsCount: number;
  /** Усі звичайні уроки модуля пройдені. */
  allLessonsDone: boolean;
  techCheckDone: boolean;
  /** Модуль закритий: техчек зданий, а якщо техчека немає — пройдені всі уроки. */
  isModuleComplete: boolean;
};

export type ItemAccess =
  | { unlocked: true }
  | {
      unlocked: false;
      reason: "previous-lesson-incomplete" | "module-lessons-incomplete";
      /** Скільки уроків лишилось пройти, щоб відкрити. */
      remaining: number;
    };

export type NextStep =
  | { kind: "lesson"; item: ModuleItem }
  | { kind: "tech-check"; item: ModuleItem }
  | { kind: "tech-check-locked"; item: ModuleItem; remaining: number }
  | { kind: "module-complete"; nextModuleId: string | null }
  | { kind: "unknown" };

const byOrderIndex = (a: ModuleItem, b: ModuleItem) => a.orderIndex - b.orderIndex;

export function getModuleState(ctx: ModuleContext): ModuleState {
  const lessons = ctx.items
    .filter((item) => item.lessonKind === "lesson")
    .sort(byOrderIndex);

  const techCheck =
    ctx.items.filter((item) => item.lessonKind === "tech_check").sort(byOrderIndex)[0] ??
    null;

  const completedLessonsCount = lessons.filter((lesson) =>
    ctx.completedIds.has(lesson.id),
  ).length;

  const allLessonsDone = lessons.length > 0 && completedLessonsCount === lessons.length;
  const techCheckDone = techCheck ? ctx.completedIds.has(techCheck.id) : false;

  return {
    lessons,
    techCheck,
    ordered: techCheck ? [...lessons, techCheck] : lessons,
    completedLessonsCount,
    totalLessonsCount: lessons.length,
    allLessonsDone,
    techCheckDone,
    // Техчек І всі уроки: складений техчек при непройдених уроках означає,
    // що десь протік доступ. Модуль у такому разі не закривається.
    isModuleComplete: techCheck ? techCheckDone && allLessonsDone : allLessonsDone,
  };
}

/** Чи можна зайти в цей елемент модуля. */
export function getItemAccess(itemId: string, ctx: ModuleContext): ItemAccess {
  const state = getModuleState(ctx);
  const item = state.ordered.find((candidate) => candidate.id === itemId);
  if (!item) return { unlocked: true };

  if (item.lessonKind === "tech_check") {
    return state.allLessonsDone
      ? { unlocked: true }
      : {
          unlocked: false,
          reason: "module-lessons-incomplete",
          remaining: state.totalLessonsCount - state.completedLessonsCount,
        };
  }

  const index = state.lessons.findIndex((lesson) => lesson.id === itemId);
  if (index <= 0) return { unlocked: true };

  const previous = state.lessons[index - 1];
  return ctx.completedIds.has(previous.id)
    ? { unlocked: true }
    : { unlocked: false, reason: "previous-lesson-incomplete", remaining: 1 };
}

/**
 * Що йде після поточного елемента.
 *
 * Відповідає на питання «що далі», а не «чи можна туди зараз» —
 * доступ рахує getItemAccess. Розділено навмисно: інтерфейсу треба показати
 * замкнений техчек із поясненням, а не приховати його.
 */
export function getNextStep(currentItemId: string, ctx: ModuleContext): NextStep {
  const state = getModuleState(ctx);
  const current = state.ordered.find((item) => item.id === currentItemId);
  if (!current) return { kind: "unknown" };

  if (current.lessonKind === "tech_check") {
    return { kind: "module-complete", nextModuleId: ctx.nextModuleId };
  }

  const index = state.lessons.findIndex((lesson) => lesson.id === currentItemId);
  const nextLesson = state.lessons[index + 1];
  if (nextLesson) return { kind: "lesson", item: nextLesson };

  if (state.techCheck) {
    return state.allLessonsDone
      ? { kind: "tech-check", item: state.techCheck }
      : {
          kind: "tech-check-locked",
          item: state.techCheck,
          remaining: state.totalLessonsCount - state.completedLessonsCount,
        };
  }

  return { kind: "module-complete", nextModuleId: ctx.nextModuleId };
}

/**
 * Скільки завдань уроку зараховано.
 *
 * Рахуємо від **списку завдань уроку**, а не від ключів у збереженому прогресі:
 * інакше перейменовані або видалені завдання лишаються в сховищі й дають
 * неможливі числа на кшталт «7 з 4».
 */
export function countCompletedTasks(
  tasks: readonly { id: string }[],
  taskStatus: Record<string, boolean> | undefined,
): number {
  return tasks.filter((task) => Boolean(taskStatus?.[task.id])).length;
}

/**
 * Елемент, з якого учень має продовжити: перший відкритий і ще не пройдений.
 * Саме він підсвічується в списку — без цього незрозуміло, куди йти далі.
 */
export function getCurrentItem(ctx: ModuleContext): ModuleItem | null {
  const { ordered } = getModuleState(ctx);
  return (
    ordered.find(
      (item) =>
        !ctx.completedIds.has(item.id) && getItemAccess(item.id, ctx).unlocked,
    ) ?? null
  );
}

export function getPreviousItem(
  currentItemId: string,
  ctx: ModuleContext,
): ModuleItem | null {
  const { ordered } = getModuleState(ctx);
  const index = ordered.findIndex((item) => item.id === currentItemId);
  return index > 0 ? ordered[index - 1] : null;
}
