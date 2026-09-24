import React from "react";

import SandboxFrame from "../../sandbox/SandboxFrame";
import type { RuntimePreviewProps } from "../../runtimes/types";
import { uk } from "../../i18n/uk";

import styles from "./CodeEditor.module.scss";

/**
 * `Preview` для `html-css-preview`: вікно браузера навколо пісочниці.
 *
 * Сама сторінка учня сюди не приходить — приходить лише **вікно**, у якому вона
 * живе. Заглянути в нього неможливо навіть нам: `sandbox="allow-scripts"` без
 * `allow-same-origin` закриває `contentDocument`, і це не обмеження, а мета.
 *
 * Темі застосунку вікно не підкоряється: сторінка учня рендериться на
 * нейтральному тлі, як у справжньому браузері. Інакше в темній темі учень
 * вирішить, що його CSS не працює.
 */
const Output: React.FC<RuntimePreviewProps> = ({ frame, problems }) => (
  <>
    <div className={styles.addressBar}>
      <input type="text" value="https://your-preview.com" readOnly />
    </div>

    <SandboxFrame frame={frame} className={styles.output} title={uk.editor.previewTitle} />

    {problems.length > 0 && (
      /* Помилка виконання — стан, у якому учень застрягає, а не дрібниця
         для консолі розробника: з `allow-scripts` його власна консоль
         недосяжна, тож сказати про помилку може лише сторінка. */
      <ul className={styles.problems} role="status">
        {problems.map((problem, index) => (
          <li
            key={index}
            className={problem.level === "error" ? styles.problemError : undefined}
          >
            {problem.text}
          </li>
        ))}
      </ul>
    )}
  </>
);

export default Output;
