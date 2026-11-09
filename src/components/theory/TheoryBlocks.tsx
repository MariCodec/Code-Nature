import React from "react";

import styles from "./TheoryBlocks.module.scss";
import InlineMarkdown from "../markdown/InlineMarkdown";
import type { LessonTheoryBlockDTO } from "../../types/content";

/**
 * Теорія уроку: `theory_blocks[]` як їх бачить учень.
 *
 * Текст, пункти списку й нотатки рендеряться **обмеженим markdown** (розділ 3
 * PLATFORM_UA): без жирного й інлайнового коду нормального пояснення не написати —
 * у справжньому тексті постійно треба виділити термін і показати тег усередині речення.
 *
 * Блоки `code` лишаються окремим типом навмисно: там ціла вставка коду, а не
 * інлайн, і їй потрібен свій вигляд, а згодом — підсвітка й копіювання.
 */
const TheoryBlocks: React.FC<{ blocks: LessonTheoryBlockDTO[] }> = ({ blocks }) => {
  const ordered = [...blocks].sort((a, b) => a.orderIndex - b.orderIndex);
  if (ordered.length === 0) return null;

  return (
    <div className={styles.blocks}>
      {ordered.map((block) => {
        switch (block.blockType) {
          case "text":
            return (
              <p key={block.id} className={styles.text}>
                <InlineMarkdown text={block.content.text} />
              </p>
            );

          case "list":
            return (
              <ul key={block.id} className={styles.list}>
                {block.content.items.map((item, index) => (
                  <li key={`${block.id}_${index}`}>
                    <InlineMarkdown text={item} />
                  </li>
                ))}
              </ul>
            );

          case "code":
            return (
              <div key={block.id} className={styles.code}>
                <span className={styles.codeLang}>
                  {block.content.lang.toUpperCase()}
                </span>
                <pre>
                  <code>{block.content.code}</code>
                </pre>
              </div>
            );

          case "note":
            return (
              <aside
                key={block.id}
                className={`${styles.note} ${
                  block.content.tone === "warning" ? styles.noteWarning : ""
                }`}
              >
                <InlineMarkdown text={block.content.text} />
              </aside>
            );
        }
      })}
    </div>
  );
};

export default TheoryBlocks;
