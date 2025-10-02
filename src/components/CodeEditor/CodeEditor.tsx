import React, { useEffect, useRef, useState } from "react";
import styles from "./CodeEditor.module.scss";
import Editor from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { useMonaco } from "@monaco-editor/react";
import { FileNames } from "../../types";
import Output from "./Output";
import LessonNavigation from "../lessonNavigation/LessonNavigation";
import "../../utils/monacoSetup";


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

  const handleRunCode = () => {
    setOutput({ ...code });
    setUserCode({ ...code });
    
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
    if (!monaco) return;

    const savedTheme = localStorage.getItem("editorTheme") || "myCustomTheme";

    monaco.editor.defineTheme("myCustomTheme", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "ff0000", fontStyle: "bold" },
        { token: "comment", foreground: "00ff00", fontStyle: "italic" },
      ],
      colors: {
        "editor.background": "#1e1e2e",
        "editor.foreground": "#ffffff",
        "editor.selectionBackground": "#264f78",
        "editorCursor.foreground": "#ffffff",
      },
    });

    monaco.editor.setTheme(savedTheme);


  
  }, [monaco]);

  return (
    <div className={styles.editorContainer}>
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
        <div className={styles.editorView}>
         
          {/* {error && ( 
          <div className={${styles.errorMessage} ${!isErrorVisible ? styles.hidden : ""}} 
          onTransitionEnd={() => { if (!isErrorVisible) { setError(null); } }} > 
          <span>{error}</span>
           <button onClick={() => setIsErrorVisible(false)}>×</button>
            </div> )} */}
          <Editor
            height="82%"
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

          <div className={styles.bottomBtn}>
            <button className={styles.neonBtn} onClick={handleRunCode}>
              Run Code
            </button>
            <button className={styles.clearBtn} onClick={clearCode}>
              Clear Code
            </button>
            <button className={styles.formatCodeBtn} onClick={formatCode}>
              Format Code
            </button>
          </div>
        </div>

        <Output html={output.html} css={output.css} />
      </div>
    </div>
  );
};

export default CodeEditor;
