import React from "react";

import { uk } from "../../i18n/uk";

import styles from "./CodeButtons.module.scss";

interface CodeButtonsProps {
  handleRunCode: () => void;
  clearCode: () => void;
  formatCode: () => void;
  htmlError: string | null;
  /**
   * Перевірка триває. Другий запуск поверх першого дав би дві перевірки на
   * одну сторінку, а відповідь прийшла б від тієї, що встигла, — тож кнопка
   * на цей час замкнена.
   */
  isRunning: boolean;
}

export const CodeButtons: React.FC<CodeButtonsProps> = ({
  handleRunCode,
  clearCode,
  formatCode,
  htmlError,
  isRunning,
}) => {
  const isRunBlocked = Boolean(htmlError) || isRunning;

  return (
    <div className={styles.bottomBtn}>
      <button
        className={`${styles.runBtn} ${isRunBlocked ? styles.runBtnDisabled : ""}`}
        onClick={handleRunCode}
        disabled={isRunning}
        aria-disabled={isRunBlocked}
        title={htmlError ? uk.editor.fixHtmlFirst : ""}
      >
        {uk.editor.run}
      </button>
      <button className={styles.clearBtn} onClick={clearCode} disabled={isRunning}>
        {uk.editor.clear}
      </button>
      <button className={styles.formatCodeBtn} onClick={formatCode}>
        {uk.editor.format}
      </button>
    </div>
  );
};
