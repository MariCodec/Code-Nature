import React, { useEffect, useState } from "react";

import SandboxFrame from "../../sandbox/SandboxFrame";
import type { RuntimePreviewProps } from "../../runtimes/types";
import type { SandboxConsoleLine } from "../../sandbox/useSandbox";
import { uk } from "../../i18n/uk";

import styles from "./CodeEditor.module.scss";

const levelClass: Record<SandboxConsoleLine["level"], string> = {
  log: styles.consoleLog,
  warn: styles.consoleWarn,
  error: styles.consoleError,
};

/**
 * `Preview` для `html-css-preview` і `js-dom`: вікно браузера навколо пісочниці.
 *
 * Сама сторінка учня сюди не приходить — приходить лише **вікно**, у якому вона
 * живе. Заглянути в нього неможливо навіть нам: `sandbox="allow-scripts"` без
 * `allow-same-origin` закриває `contentDocument`, і це не обмеження, а мета.
 *
 * Темі застосунку вікно не підкоряється: сторінка учня рендериться на
 * нейтральному тлі, як у справжньому браузері. Інакше в темній темі учень
 * вирішить, що його CSS не працює.
 */
const Output: React.FC<RuntimePreviewProps> = ({ frame, consoleOutput }) => {
  const { lines, dropped } = consoleOutput;
  const [isOpen, setIsOpen] = useState(false);
  const hasError = lines.some((line) => line.level === "error");

  // Новий запуск — нове вікно й порожній вивід, тож смужка згортається назад.
  useEffect(() => {
    setIsOpen(false);
  }, [frame.generation]);

  /**
   * Помилка розкриває смужку сама, `console.log` — ні, і це рівно та різниця,
   * заради якої смужка взагалі згортається.
   *
   * Помилка рідкісна й важлива: не показати її означає лишити учня з мертвою
   * сторінкою й без причини. Друк — частий і очікуваний: `for` на сто ітерацій
   * це звичайне перше завдання, і накрити ним третину сторінки назавжди
   * означало б забрати те, на що учень і прийшов дивитись.
   */
  useEffect(() => {
    if (hasError) setIsOpen(true);
  }, [hasError]);

  return (
    <>
      <div className={styles.addressBar}>
        <input type="text" value="https://your-preview.com" readOnly />
      </div>

      <SandboxFrame frame={frame} className={styles.output} title={uk.editor.previewTitle} />

      {lines.length > 0 && (
        /* Вивід програми поверх сторінки учня. Накладкою, а не третім рядком
           розмітки: висоти вікна браузера пораховані під адресний рядок
           і preview, і поява смужки знизу з'їдала б саме те, заради чого
           учень сюди дивиться. */
        <div className={styles.console}>
          <button
            type="button"
            className={styles.consoleBar}
            onClick={() => setIsOpen((current) => !current)}
            aria-expanded={isOpen}
            title={uk.editor.console.toggle}
          >
            <span className={styles.consoleLabel}>{uk.editor.console.label}</span>
            <span className={styles.consoleCount}>{uk.editor.console.count(lines.length)}</span>
            {hasError && (
              <span className={styles.consoleAlarm}>{uk.editor.console.errorMark}</span>
            )}
          </button>

          {isOpen && (
            <ul className={styles.consoleLines} role="status">
              {lines.map((line, index) => (
                <li key={index} className={levelClass[line.level]}>
                  {line.text}
                </li>
              ))}
              {dropped > 0 && (
                /* Межа має бути видимою: двадцять рядків зі ста без цього
                   напису — це неправда про те, що зробила програма. */
                <li className={styles.consoleDropped}>{uk.editor.console.hidden(dropped)}</li>
              )}
            </ul>
          )}
        </div>
      )}
    </>
  );
};

export default Output;
