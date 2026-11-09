import React from "react";
import styles from "./ModuleCompleteOverlay.module.scss";
import { uk } from "../../i18n/uk";

type ModuleCompleteOverlayProps = {
  moduleTitle: string;
  lessonsCount: number;
  hasTechCheck: boolean;
  nextModuleTitle: string | null;
  onNext: () => void;
  onDismiss: () => void;
};

/**
 * Підсумок модуля. Зʼявляється, коли модуль закрито — тобто зданий техчек,
 * а якщо техчека немає, пройдено останній урок.
 *
 * Не блокує: учень може закрити й лишитись на сторінці, щоб передивитись свою роботу.
 */
const ModuleCompleteOverlay: React.FC<ModuleCompleteOverlayProps> = ({
  moduleTitle,
  lessonsCount,
  hasTechCheck,
  nextModuleTitle,
  onNext,
  onDismiss,
}) => (
  <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label={uk.moduleSummary.eyebrow}>
    <section className={styles.card}>
      <p className={styles.eyebrow}>{uk.moduleSummary.eyebrow}</p>
      <h2 className={styles.title}>{moduleTitle}</h2>

      <p className={styles.lead}>
        {hasTechCheck
          ? uk.moduleSummary.withTechCheck
          : uk.moduleSummary.withoutTechCheck}
      </p>

      <dl className={styles.stats}>
        <div className={styles.stat}>
          <dt>{uk.moduleSummary.lessonsDone}</dt>
          <dd>{lessonsCount}</dd>
        </div>
        <div className={styles.stat}>
          <dt>{uk.moduleSummary.techCheckLabel}</dt>
          <dd>{hasTechCheck ? uk.moduleSummary.techCheckPassed : uk.moduleSummary.techCheckNone}</dd>
        </div>
      </dl>

      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={onNext}>
          {nextModuleTitle
            ? uk.moduleSummary.next(nextModuleTitle)
            : uk.moduleSummary.toCourses}
        </button>
        <button type="button" className={styles.secondary} onClick={onDismiss}>
          {uk.moduleSummary.stay}
        </button>
      </div>
    </section>
  </div>
);

export default ModuleCompleteOverlay;
