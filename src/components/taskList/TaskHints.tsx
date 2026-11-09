import React, { useState } from "react";

import styles from "./TaskList.module.scss";
import InlineMarkdown from "../markdown/InlineMarkdown";
import { uk } from "../../i18n/uk";

/**
 * Підказки завдання, що розкриваються **поступово**.
 *
 * У самостійному режимі спитати нікого, тож підказки — заміна викладача, а не
 * додаткова зручність (PLATFORM_UA, розділ 3). Тому вони не показуються всі одразу:
 * учень, який бачить третю підказку поруч із першою, читає відповідь, а не думає.
 *
 * Скільки підказок відкрито — поки локальний стан. У моделі даних для цього є
 * `student_task_progress.hints_used`, але прогрес у стані ще не має форми DTO:
 * це робота Фази 6, і вигадувати їй проміжне сховище зараз означало б викинути його там.
 */
const TaskHints: React.FC<{ hints: string[] }> = ({ hints }) => {
  const [openedCount, setOpenedCount] = useState(0);

  if (hints.length === 0) return null;

  const hasMore = openedCount < hints.length;

  return (
    <div className={styles.hints}>
      {hints.slice(0, openedCount).map((hint, index) => (
        <p key={index} className={styles.hint}>
          <span className={styles.hintCounter}>
            {uk.hints.counter(index + 1, hints.length)}
          </span>
          <InlineMarkdown text={hint} />
        </p>
      ))}

      <div className={styles.hintActions}>
        {hasMore && (
          <button
            type="button"
            className={styles.hintButton}
            onClick={() => setOpenedCount((count) => count + 1)}
          >
            {openedCount === 0 ? uk.hints.show : uk.hints.next}
          </button>
        )}

        {openedCount > 0 && (
          <button
            type="button"
            className={styles.hintButtonQuiet}
            onClick={() => setOpenedCount(0)}
          >
            {uk.hints.hide}
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskHints;
