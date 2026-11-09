import React from "react";

import styles from "./LessonStepsBar.module.scss";
import { uk } from "../../i18n/uk";
import type { LessonStep } from "../../domain/lessonSteps";

/**
 * Смужка кроків уроку — перша третина каркаса (шапка → вміст → навігація).
 *
 * Кроки **клікабельні всі**, і замків між ними немає навмисно. Повернутись
 * до відео під час практики треба вміти (розділ 4), а другий плеєр у бічній
 * панелі саме цю потребу й закривав — погано, бо плеєрів ставало два.
 * Крок — це спосіб ходити по тому самому уроку, а не ворота: ворота в системі
 * одні, і вони на рівні уроку й модуля.
 *
 * Стану «пройдено» тут немає, і це рішення. Позиція лівіше за поточну не
 * означає зробленого: учень міг перегорнути крок практики, нічого не виконавши.
 * Зелена галочка там була б тим самим хибним сигналом, що «відео додивлене»,
 * проставлене кліком.
 */
const stepLabel: Record<LessonStep["kind"], string> = {
  video: uk.lessonSteps.video,
  theory: uk.lessonSteps.theory,
  practice: uk.lessonSteps.practice,
};

type LessonStepsBarProps = {
  steps: LessonStep[];
  currentIndex: number;
  onSelect: (index: number) => void;
};

const LessonStepsBar: React.FC<LessonStepsBarProps> = ({
  steps,
  currentIndex,
  onSelect,
}) => {
  // Один крок — це не послідовність, і смужка з єдиною позицією лише забирає
  // місце, нічого не повідомляючи. Саме такий урок у контенті найчастіший.
  if (steps.length < 2) return null;

  return (
    <nav
      className={styles.steps}
      aria-label={uk.lessonSteps.barLabel}
    >
      <ol className={styles.list}>
        {steps.map((step, index) => (
          <li key={step.kind}>
            <button
              type="button"
              className={`${styles.step} ${index === currentIndex ? styles.current : ""}`}
              aria-current={index === currentIndex ? "step" : undefined}
              onClick={() => onSelect(index)}
            >
              <span className={styles.number}>{index + 1}</span>
              <span className={styles.label}>{stepLabel[step.kind]}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default LessonStepsBar;
