import { Fragment } from "react";
import { parseLines, type InlineToken } from "../../domain/inlineMarkdown";
import styles from "./InlineMarkdown.module.scss";

const renderTokens = (tokens: InlineToken[]) =>
  tokens.map((token, index) => {
    if (token.type === "code") {
      return (
        <code key={index} className={styles.code}>
          {token.value}
        </code>
      );
    }
    if (token.type === "bold") {
      return <strong key={index}>{token.value}</strong>;
    }
    return <Fragment key={index}>{token.value}</Fragment>;
  });

/** Рендерить обмежений markdown навчального контенту: жирний, код, пункти списку. */
export default function InlineMarkdown({ text }: { text: string }) {
  const lines = parseLines(text);
  const bullets = lines.filter((line) => line.isBullet);

  if (bullets.length > 0 && bullets.length === lines.filter((l) => l.tokens.length).length) {
    return (
      <ul className={styles.list}>
        {bullets.map((line, index) => (
          <li key={index}>{renderTokens(line.tokens)}</li>
        ))}
      </ul>
    );
  }

  return (
    <>
      {lines.map((line, index) =>
        line.isBullet ? (
          <span key={index} className={styles.bullet}>
            {renderTokens(line.tokens)}
          </span>
        ) : (
          <Fragment key={index}>
            {index > 0 && <br />}
            {renderTokens(line.tokens)}
          </Fragment>
        ),
      )}
    </>
  );
}
