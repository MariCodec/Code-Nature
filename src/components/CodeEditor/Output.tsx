import React, { useEffect, useRef } from "react";
import styles from "./CodeEditor.module.scss";

interface OutputProps {
  /** Цілий документ, зібраний runtime-ом уроку (`buildDocument` у реєстрі). */
  documentHtml: string;
}

const Output: React.FC<OutputProps> = ({ documentHtml }) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const frameDocument = iframeRef.current?.contentDocument;
    if (!frameDocument) return;

    frameDocument.open();
    frameDocument.write(documentHtml);
    frameDocument.close();
  }, [documentHtml]);

  return (
    <>
      <div className={styles.addressBar}>
        <input type="text" value="https://your-preview.com" readOnly />
      </div>
      <iframe className={styles.output} ref={iframeRef} />
    </>
  );
};

export default Output;
