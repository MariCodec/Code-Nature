import React, { useEffect, useRef } from "react";
import styles from "./CodeEditor.module.scss";

interface OutputProps {
  html: string;
  css: string;
  // js: string;
}

const Output: React.FC<OutputProps> = ({ html, css }) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (iframeRef.current) {
      const document = iframeRef.current.contentDocument;
      if (document) {
        document.open();
        document.write(`
          <html>
            <head>
              <style>${css}</style>
            </head>
            <body>
              ${html}
      
            </body>
          </html>
        `);
        document.close();
      }
    }
  }, [html, css]);

  return (
    <div className={styles.browserWindow}>
      <div className={styles.addressBar}>
        <input type="text" value="https://your-preview.com" readOnly />
      </div>
      <iframe className={styles.output} ref={iframeRef} />;
    </div>
  );
};

export default Output;
