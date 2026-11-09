import { useState } from "react";
import { Link } from "react-router-dom";

import styles from "./TechCheckQuiz.module.scss";
import InlineMarkdown from "../markdown/InlineMarkdown";
import { uk } from "../../i18n/uk";
import {
  checkQuizAnswer,
  getFeedbackKey,
  getQuizProgress,
  getSelectionMode,
  type QuizTask,
  type QuizVerdict,
} from "../../domain/techCheck";

type TechCheckQuizProps = {
  lessonTitle: string;
  questions: QuizTask[];
  passedTaskIds: Record<string, boolean>;
  onPass: (taskId: string) => void;
  buildReviewHref: (lessonId: string) => string;
};

/**
 * Перша частина техчека. Питання йдуть по одному, перевіряються одразу,
 * помилка не відкладається на потім і не блокує назавжди — пояснив і пробуй тут же.
 */
export default function TechCheckQuiz({
  lessonTitle,
  questions,
  passedTaskIds,
  onPass,
  buildReviewHref,
}: TechCheckQuizProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [verdict, setVerdict] = useState<QuizVerdict | null>(null);
  /**
   * Питання фіксується локально після відповіді. Без цього прогрес зсувається
   * одразу після зарахування, і панель «Правильно» показується вже поверх
   * наступного питання.
   */
  const [pinnedQuestionId, setPinnedQuestionId] = useState<string | null>(null);

  const progress = getQuizProgress(questions, passedTaskIds);
  const question =
    questions.find((item) => item.id === pinnedQuestionId) ?? progress.currentQuestion;
  if (!question) return null;

  const mode = getSelectionMode(question.rules);
  const shownIndex = questions.findIndex((item) => item.id === question.id);
  const isLast = shownIndex === questions.length - 1;

  const toggleOption = (optionId: string) => {
    if (verdict?.correct) return;
    setVerdict(null);
    setSelected((prev) =>
      mode === "single"
        ? [optionId]
        : prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId],
    );
  };

  const submit = () => {
    const result = checkQuizAnswer(question.rules, selected);
    setVerdict(result);
    if (result.correct) {
      setPinnedQuestionId(question.id);
      onPass(question.id);
    }
  };

  // Знімаємо вердикт, але лишаємо вибір: при «правильно, але не все»
  // логічно додати пропущений варіант, а не набирати відповідь заново.
  const retry = () => setVerdict(null);

  const goNext = () => {
    setSelected([]);
    setVerdict(null);
    setPinnedQuestionId(null);
  };

  const isWrong = verdict !== null && !verdict.correct;
  const feedbackKey = verdict ? getFeedbackKey(verdict, mode) : null;

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <header className={styles.head}>
          <span className={styles.badge}>{uk.techCheck.badge}</span>
          <h1>{lessonTitle}</h1>
          <p className={styles.lead}>{uk.techCheck.intro}</p>

          <div
            className={styles.steps}
            aria-label={uk.techCheck.questionCounter(shownIndex + 1, progress.total)}
          >
            {questions.map((item, index) => (
              <span
                key={item.id}
                className={`${styles.step} ${
                  passedTaskIds[item.id]
                    ? styles.stepDone
                    : index === shownIndex
                      ? styles.stepCurrent
                      : ""
                }`}
              />
            ))}
            <span className={styles.stepsLabel}>
              {uk.techCheck.questionCounter(shownIndex + 1, progress.total)}
            </span>
          </div>
        </header>

        <h2 className={styles.question}>
          <InlineMarkdown text={question.description} />
        </h2>
        <p className={styles.modeHint}>
          {mode === "multiple" ? uk.techCheck.modeMultiple : uk.techCheck.modeSingle}
        </p>

        <ul className={styles.options}>
          {question.rules.options.map((option) => {
            const isChosen = selected.includes(option.id);
            return (
              <li key={option.id}>
                <label
                  className={`${styles.option} ${isChosen ? styles.optionChosen : ""} ${
                    verdict?.correct && isChosen ? styles.optionCorrect : ""
                  } ${isWrong && isChosen ? styles.optionWrong : ""}`}
                >
                  <input
                    type={mode === "multiple" ? "checkbox" : "radio"}
                    name="quiz-option"
                    checked={isChosen}
                    onChange={() => toggleOption(option.id)}
                    disabled={verdict?.correct}
                  />
                  <span>{option.text}</span>
                </label>
              </li>
            );
          })}
        </ul>

        {isWrong && (
          <div className={`${styles.feedback} ${styles.feedbackWrong}`}>
            <strong>{feedbackKey && uk.techCheck.feedback[feedbackKey]}</strong>
            <p>
              <InlineMarkdown text={question.explanation} />
            </p>
            {question.rules.reviewLessonId && (
              <Link
                className={styles.reviewLink}
                to={buildReviewHref(question.rules.reviewLessonId)}
              >
                {uk.techCheck.backToLesson}
              </Link>
            )}
          </div>
        )}

        {verdict?.correct && (
          <div className={`${styles.feedback} ${styles.feedbackRight}`}>
            <strong>{uk.techCheck.correct}</strong>
            <p>
              <InlineMarkdown text={question.explanation} />
            </p>
          </div>
        )}

        <div className={styles.actions}>
          {verdict?.correct ? (
            <button type="button" className={styles.primary} onClick={goNext}>
              {isLast ? uk.techCheck.toPractice : uk.techCheck.nextQuestion}
            </button>
          ) : isWrong ? (
            <button type="button" className={styles.primary} onClick={retry}>
              {uk.techCheck.retry}
            </button>
          ) : (
            <button
              type="button"
              className={styles.primary}
              onClick={submit}
              disabled={selected.length === 0}
            >
              {uk.techCheck.check}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
