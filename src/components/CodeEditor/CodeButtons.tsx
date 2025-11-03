import React from 'react'
import styles from './CodeEditor.module.scss';
interface CodeButtonsProps {
  handleRunCode: () => void;
  clearCode: () => void;
  formatCode: () => void;
}
export const CodeButtons: React.FC<CodeButtonsProps> = ({
  handleRunCode,
  clearCode,
  formatCode,
}) => {
  return (
    <>
      {" "}
      <div className={styles.bottomBtn}>
        <button className={styles.runBtn} onClick={handleRunCode}>
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
