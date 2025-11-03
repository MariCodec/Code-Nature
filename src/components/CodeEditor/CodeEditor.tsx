import React, { useEffect, useRef, useState } from "react";
import styles from "./CodeEditor.module.scss";
import Editor from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { useMonaco } from "@monaco-editor/react";
import { FileNames } from "../../types";
import Output from "./Output";
import LessonNavigation from "../lessonNavigation/LessonNavigation";
import "../../utils/monacoSetup";
import { CodeButtons } from "./CodeButtons";
import { useResizable } from "../../hooks/useResizable";
import { useHtmlValidation } from "../../hooks/useHtmlValidation";
import { setupMonacoTheme } from "../../utils/setupMonacoTheme";


interface CodeEditorProps {
  initialHtml: string;
  initialCss: string;
  toggleBtn: () => void;
  isVisible: boolean;
  currentLessonId: string;
  setUserCode: (code: { html: string; css: string }) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  initialHtml,
  initialCss,
  toggleBtn,
  isVisible,
  currentLessonId,
  setUserCode,
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monaco = useMonaco();

  const [fileName, setFileName] = useState<FileNames>(FileNames.HTML);
  const [code, setCode] = useState({ html: initialHtml, css: initialCss });
  const [output, setOutput] = useState({ html: initialHtml, css: initialCss });
  //  const [error, setError] = useState<null | string>(null); 
 // const [isErrorVisible, setIsErrorVisible] = useState(false);
  // Worker для Monaco
const { containerRef, dividerPosition, startResizing, isOverlayVisible } =
  useResizable();


  const onMount = (editorInstance: editor.IStandaloneCodeEditor) => {
    editorRef.current = editorInstance;
    editorInstance.focus();
  };

  const handleChange = (newValue: string | undefined) => {
    setCode((prev) => ({
      ...prev,
      [fileName === FileNames.HTML ? "html" : "css"]: newValue || "",
    }));
  };

  // Повертає масив декорацій для Monaco
  const { validateHtml } = useHtmlValidation();
  const handleRunCode = () => {
    setOutput({ ...code });
    setUserCode({ ...code });
  if (monaco && editorRef.current) {
    validateHtml(monaco, editorRef.current, code.html);
  }
  };

  const clearCode = () => {
    setCode({ html: initialHtml, css: initialCss });
    setOutput({ html: initialHtml, css: initialCss });
  };

  const formatCode = () => {
    editorRef.current?.getAction("editor.action.formatDocument")?.run();
  };

  // Ініціалізація теми Monaco
useEffect(() => {
  if (monaco) setupMonacoTheme(monaco);
}, [monaco]);
  return (
    <div className={styles.editorContainer} ref={containerRef}>
      <div className={styles.tabs}>
        <button className={styles.toggleBtn} onClick={toggleBtn}>
          {isVisible ? "Приховати деталі уроку" : "Деталі уроку"}
        </button>

        <button
          className={`${styles.tabButtons} ${fileName === FileNames.STYLE ? styles.active : ""}`}
          disabled={fileName === FileNames.STYLE}
          onClick={() => setFileName(FileNames.STYLE)}
        >
          style.css
        </button>

        <button
          className={`${styles.tabButtons} ${fileName === FileNames.HTML ? styles.active : ""}`}
          disabled={fileName === FileNames.HTML}
          onClick={() => setFileName(FileNames.HTML)}
        >
          index.html
        </button>

        <LessonNavigation currentLessonId={currentLessonId} />
      </div>

      <div className={styles.container}>
        <div
          className={styles.editorView}
          style={{ width: `${dividerPosition}%` }}
        >
          {/* {error && ( 
          <div className={${styles.errorMessage} ${!isErrorVisible ? styles.hidden : ""}} 
          onTransitionEnd={() => { if (!isErrorVisible) { setError(null); } }} > 
          <span>{error}</span>
           <button onClick={() => setIsErrorVisible(false)}>×</button>
            </div> )} */}
          <Editor
            theme="myCustomTheme"
            language={fileName === FileNames.HTML ? "html" : "css"}
            value={fileName === FileNames.HTML ? code.html : code.css}
            onChange={handleChange}
            onMount={onMount}
            options={{
              formatOnPaste: true,
              formatOnType: true,
              wordWrap: "on",
              minimap: { enabled: false },
            }}
          />

          <CodeButtons
            handleRunCode={handleRunCode}
            clearCode={clearCode}
            formatCode={formatCode}
          />
        </div>

        {/* draggable line */}
        <div className={styles.resizer} onMouseDown={startResizing} />

        <div
          className={styles.browserWindow}
          style={{ width: `${100 - dividerPosition}%` }}
        >
          <Output html={output.html} css={output.css} />
        </div>
      </div>
      {isOverlayVisible && <div className={styles.overlay} />}
    </div>
  );
};

export default CodeEditor;
