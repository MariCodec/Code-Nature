import type { LessonKind } from "../../types/content";
import { uk } from "../../i18n/uk";
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
        {/* Бейдж у рядку з назвою, а не над нею: окремим рядком він коштував
            24px вертикалі на кожному кроці — а на кроці практики кожен піксель
            висоти йде редакторові. */}
        <div className={styles.titleRow}>
          <span className={styles.kindBadge}>
            {isTechCheck ? uk.techCheck.badge : uk.techCheck.lessonBadge}
          </span>
          <h1>{title}</h1>
        </div>
        <p>{description}</p>
        {isTechCheck && (
          <p className={styles.techCheckNote}>
            {uk.techCheck.note(moduleLessonsCount ?? 0)}
          </p>
        )}
      </div>
    </div>
  );
}
