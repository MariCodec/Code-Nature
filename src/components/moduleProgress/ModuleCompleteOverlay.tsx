import React from "react";
import styles from "./ModuleCompleteOverlay.module.scss";

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
  <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label="Модуль пройдено">
    <section className={styles.card}>
      <p className={styles.eyebrow}>Модуль пройдено</p>
      <h2 className={styles.title}>{moduleTitle}</h2>

      <p className={styles.lead}>
        {hasTechCheck
          ? "Ти не просто пройшов уроки, а склав перевірку — тобто зібрав рішення самостійно."
          : "Усі уроки модуля пройдені."}
      </p>

      <dl className={styles.stats}>
        <div className={styles.stat}>
          <dt>Уроків пройдено</dt>
          <dd>{lessonsCount}</dd>
        </div>
        <div className={styles.stat}>
          <dt>Перевірка модуля</dt>
          <dd>{hasTechCheck ? "складена" : "не потрібна"}</dd>
        </div>
      </dl>

      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={onNext}>
          {nextModuleTitle ? `Далі: ${nextModuleTitle}` : "До списку курсів"}
        </button>
        <button type="button" className={styles.secondary} onClick={onDismiss}>
          Лишитись тут
        </button>
      </div>
    </section>
  </div>
);

export default ModuleCompleteOverlay;
