/**
 * Логіка техчека: питання, вердикт по відповіді, перехід до практики.
 *
 * Чисті функції, без React і Redux — як і `progression`.
 * Техчек складається з питань (`rules.kind = "quiz"`) і практики; питання йдуть
 * першими за `orderIndex`, практика відкривається лише після всіх правильних відповідей.
 */

import type { LessonTaskDTO } from "../types/content";
import type { QuizTaskRules, TaskRules } from "../types/lessonTypes";

export const isQuizRules = (rules: TaskRules): rules is QuizTaskRules =>
  rules.kind === "quiz";

export type QuizTask = LessonTaskDTO & { rules: QuizTaskRules };

export type QuizVerdict =
  | { correct: true }
  | { correct: false; reason: "empty" | "extra" | "missing" };

/** Підпис показує режим, ніколи кількість правильних. */
export function getSelectionMode(rules: QuizTaskRules): "single" | "multiple" {
  return rules.selectionMode ?? (rules.correctOptionIds.length > 1 ? "multiple" : "single");
}

/**
 * Зараховується лише повний збіг — це ворота, «майже» тут не працює.
 * Але причина конкретна, щоб учень не тицяв навмання.
 */
export function checkQuizAnswer(
  rules: QuizTaskRules,
  selectedIds: readonly string[],
): QuizVerdict {
  if (selectedIds.length === 0) return { correct: false, reason: "empty" };

  const correct = new Set(rules.correctOptionIds);
  const hasWrong = selectedIds.some((id) => !correct.has(id));
  if (hasWrong) return { correct: false, reason: "extra" };

  const selected = new Set(selectedIds);
  const missesSome = rules.correctOptionIds.some((id) => !selected.has(id));
  if (missesSome) return { correct: false, reason: "missing" };

  return { correct: true };
}

export function describeVerdict(
  verdict: QuizVerdict,
  mode: "single" | "multiple" = "multiple",
): string | null {
  if (verdict.correct) return null;

  switch (verdict.reason) {
    case "empty":
      return "Обери варіант відповіді.";
    case "extra":
      // Для одиночного вибору «зайвий» звучить дивно: там просто не та відповідь.
      return mode === "single"
        ? "Це не та відповідь."
        : "Один із обраних варіантів тут зайвий.";
    case "missing":
      return "Правильно, але не все — є ще один варіант.";
  }
}

export function splitTechCheckTasks(tasks: LessonTaskDTO[]): {
  questions: QuizTask[];
  practice: LessonTaskDTO[];
} {
  const byOrder = [...tasks].sort((a, b) => a.orderIndex - b.orderIndex);

  return {
    questions: byOrder.filter((task): task is QuizTask => isQuizRules(task.rules)),
    practice: byOrder.filter((task) => !isQuizRules(task.rules)),
  };
}

export type QuizProgress = {
  total: number;
  passedCount: number;
  /** Перше ще не зараховане питання; null — усі пройдені. */
  currentQuestion: QuizTask | null;
  currentIndex: number;
  allPassed: boolean;
};

export function getQuizProgress(
  questions: QuizTask[],
  passedTaskIds: Record<string, boolean> | undefined,
): QuizProgress {
  const isPassed = (id: string) => Boolean(passedTaskIds?.[id]);
  const passedCount = questions.filter((question) => isPassed(question.id)).length;
  const currentIndex = questions.findIndex((question) => !isPassed(question.id));

  return {
    total: questions.length,
    passedCount,
    currentQuestion: currentIndex >= 0 ? questions[currentIndex] : null,
    currentIndex,
    allPassed: questions.length > 0 && currentIndex === -1,
  };
}

/**
 * Практика техчека відкривається лише після всіх питань.
 * Якщо питань немає — практика доступна одразу (сумісність зі старим контентом).
 */
export function isPracticeUnlocked(
  questions: QuizTask[],
  passedTaskIds: Record<string, boolean> | undefined,
): boolean {
  return questions.length === 0 || getQuizProgress(questions, passedTaskIds).allPassed;
}
