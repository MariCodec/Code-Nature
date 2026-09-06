import type { LessonKind } from "../../types/content";
import styles from "./LessonHeader.module.scss";

interface LessonHeaderProps {
  title: string;
  description: string;
  lessonKind?: LessonKind;
  /** Скільки уроків модуля пройдено — показуємо лише для техчека. */
  moduleLessonsCount?: number;
}

export default function LessonHeader({
  title,
  description,
  lessonKind = "lesson",
  moduleLessonsCount,
}: LessonHeaderProps) {
  const isTechCheck = lessonKind === "tech_check";

  return (
    <div
      className={`${styles.lessonHeader} ${isTechCheck ? styles.techCheck : ""}`}
    >
      <div className={styles.lessonTitle}>
        <span className={styles.kindBadge}>
          {isTechCheck ? "Контрольна перевірка" : "Урок"}
        </span>
        <h1>{title}</h1>
        <p>{description}</p>
        {isTechCheck && (
          <p className={styles.techCheckNote}>
            Це підсумок модуля{
              typeof moduleLessonsCount === "number" && moduleLessonsCount > 0
                ? ` з ${moduleLessonsCount} уроків`
                : ""
            }. Нової теорії тут немає, підказок майже немає — збери рішення сам.
            Скласти можна з будь-якої спроби.
          </p>
        )}
      </div>
    </div>
  );
}
