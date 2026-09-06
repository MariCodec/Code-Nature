import { describe, expect, it } from "vitest";
import {
  checkQuizAnswer,
  describeVerdict,
  getQuizProgress,
  getSelectionMode,
  isPracticeUnlocked,
  splitTechCheckTasks,
  type QuizTask,
} from "./techCheck";
import type { LessonTaskDTO } from "../types/content";
import type { QuizTaskRules } from "../types/lessonTypes";

const quizRules = (correct: string[], mode?: "single" | "multiple"): QuizTaskRules => ({
  kind: "quiz",
  selectionMode: mode,
  options: [
    { id: "a", text: "A" },
    { id: "b", text: "B" },
    { id: "c", text: "C" },
  ],
  correctOptionIds: correct,
  explanation: "бо так",
});

const question = (id: string, orderIndex: number, correct: string[]): QuizTask => ({
  id,
  title: id,
  description: id,
  orderIndex,
  rules: quizRules(correct),
});

const practice = (id: string, orderIndex: number): LessonTaskDTO => ({
  id,
  title: id,
  description: id,
  orderIndex,
  rules: { htmlSelectors: [{ selector: "h1" }] },
});

describe("checkQuizAnswer", () => {
  it("точний збіг зараховується, порядок вибору не важливий", () => {
    expect(checkQuizAnswer(quizRules(["a", "b"]), ["b", "a"])).toEqual({ correct: true });
  });

  it("розрізняє зайвий варіант і недобраний", () => {
    // Від цього залежить текст підказки: «зайвий» проти «є ще один»
    expect(checkQuizAnswer(quizRules(["b"]), ["b", "c"])).toEqual({
      correct: false,
      reason: "extra",
    });
    expect(checkQuizAnswer(quizRules(["a", "b"]), ["a"])).toEqual({
      correct: false,
      reason: "missing",
    });
  });

  it("порожній вибір не зараховується", () => {
    expect(checkQuizAnswer(quizRules(["b"]), [])).toEqual({
      correct: false,
      reason: "empty",
    });
  });
});

describe("getSelectionMode", () => {
  it("вибір автора важливіший за кількість правильних", () => {
    // Одна правильна, але подана як множинний — щоб інтерфейс не видав відповідь
    expect(getSelectionMode(quizRules(["a"], "multiple"))).toBe("multiple");
  });
});

describe("describeVerdict", () => {
  it("для одиночного вибору не каже «зайвий»", () => {
    expect(describeVerdict({ correct: false, reason: "extra" }, "single")).toBe(
      "Це не та відповідь.",
    );
  });
});

describe("splitTechCheckTasks", () => {
  it("розділяє питання і практику, зберігаючи порядок", () => {
    const { questions, practice: prac } = splitTechCheckTasks([
      practice("p1", 10),
      question("q2", 2, ["a"]),
      question("q1", 1, ["b"]),
    ]);
    expect(questions.map((q) => q.id)).toEqual(["q1", "q2"]);
    expect(prac.map((p) => p.id)).toEqual(["p1"]);
  });
});

describe("getQuizProgress", () => {
  const questions = [question("q1", 1, ["a"]), question("q2", 2, ["b"])];

  it("зсувається на наступне нескладене", () => {
    expect(getQuizProgress(questions, { q1: true }).currentQuestion?.id).toBe("q2");
  });

  it("коли всі складені — поточного немає", () => {
    const progress = getQuizProgress(questions, { q1: true, q2: true });
    expect(progress.currentQuestion).toBeNull();
    expect(progress.allPassed).toBe(true);
  });
});

describe("isPracticeUnlocked", () => {
  const questions = [question("q1", 1, ["a"]), question("q2", 2, ["b"])];

  it("закрита, поки лишилось питання", () => {
    expect(isPracticeUnlocked(questions, { q1: true })).toBe(false);
  });

  it("відкривається після всіх питань", () => {
    expect(isPracticeUnlocked(questions, { q1: true, q2: true })).toBe(true);
  });

  it("без питань доступна одразу — сумісність зі старим контентом", () => {
    expect(isPracticeUnlocked([], {})).toBe(true);
  });
});
