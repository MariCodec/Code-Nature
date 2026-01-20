import React from 'react'
import styles from './CodeEditor.module.scss';
interface CodeButtonsProps {
  handleRunCode: () => void;
  clearCode: () => void;
  formatCode: () => void;
  htmlError: string | null;
}
export const CodeButtons: React.FC<CodeButtonsProps> = ({
  handleRunCode,
  clearCode,
  formatCode,
  htmlError,
}) => {
  return (
    <>
      {" "}
      <div className={styles.bottomBtn}>
        <button
          className={`${styles.runBtn} ${htmlError ? styles.runBtnDisabled : ""}`}
          onClick={handleRunCode}
          aria-disabled={!!htmlError}
          title={htmlError ? "Виправте помилки в HTML, щоб запустити код" : ""}
        >
          Run Code
        </button>
        <button className={styles.clearBtn} onClick={clearCode}>
          Clear Code
        </button>
        <button className={styles.formatCodeBtn} onClick={formatCode}>
          Format Code
        </button>
      </div>
    </>
  );
};
