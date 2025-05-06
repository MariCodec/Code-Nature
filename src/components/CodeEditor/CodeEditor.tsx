import React, { useEffect, useRef, useState } from "react";
import styles from "./CodeEditor.module.scss";
import Editor from "@monaco-editor/react";
// import { editor } from "monaco-editor";
import { useMonaco } from "@monaco-editor/react";
import { FileNames, Files } from "../../types";
// import * as monaco from "monaco-editor";
import Output from "./Output"; // Підключаємо Output
import { editor } from "monaco-editor";
import LessonNavigation from "../lessonNavigation/LessonNavigation";

// import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

interface CodeEditorProps {
  initialHtml: string;
  initialCss: string;
  // initialJs: string;
  toggleBtn: () => void;
  isVisible: boolean;
  currentLessonId: string;
  setUserCode: (code: { html: string; css: string }) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  initialHtml,
  initialCss,
  // initialJs,
  toggleBtn,
  isVisible,
  currentLessonId,
  setUserCode,
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [fileName, setFileName] = useState<FileNames>(FileNames.HTML);

  // Поточні значення в редакторі
  const [htmlCode, setHtmlCode] = useState<string>(initialHtml);
  const [cssCode, setCssCode] = useState<string>(initialCss);
  console.log(initialCss);

  // const [jsCode, setJsCode] = useState<string>(initialJs);
  const [value, setValue] = useState<string>(initialHtml);

  // Збережені значення для Output (тільки після натискання "Run Code")
  const [outputHtml, setOutputHtml] = useState<string>(initialHtml);
  const [outputCss, setOutputCss] = useState<string>(initialCss);
  // const [outputJs, setOutputJs] = useState<string>(initialJs);

  const monaco = useMonaco(); // Отримуємо об'єкт Monaco

  const formatCode = () => {
    editorRef.current?.getAction("editor.action.formatDocument")?.run();
  };
  useEffect(() => {
    setHtmlCode(initialHtml);
    setCssCode(initialCss);
    setUserCode({ html: initialHtml, css: initialCss });
    setOutputHtml(initialHtml);
    setOutputCss(initialCss);
    if (fileName === FileNames.HTML) {
      setValue(initialHtml);
    } else if (fileName === FileNames.STYLE) {
      setValue(initialCss);
    }
  }, [initialHtml, initialCss, fileName]);
  useEffect(() => {
    if (monaco) {
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
    }
  }, [monaco]);

  const onMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    editor.focus();
  };

  const files: Files = {
    // "script.js": {
    //   name: "script.js",
    //   language: "javascript",
    //   value: jsCode,
    // },
    "style.css": {
      name: "style.css",
      language: "css",
      value: cssCode,
    },
    "index.html": {
      name: "index.html",
      language: "html",
      value: htmlCode,
    },
  };

  // Оновлюємо редактор при зміні вкладки
  useEffect(() => {
    if (fileName === FileNames.HTML) setValue(htmlCode);
    if (fileName === FileNames.STYLE) setValue(cssCode);
    formatCode();
  }, [fileName, htmlCode, cssCode]);

  // Оновлюємо стан при зміні тексту
  const handleChange = (newValue: string | undefined) => {
    setValue(newValue || "");

    if (fileName === FileNames.HTML) setHtmlCode(newValue || "");
    if (fileName === FileNames.STYLE) setCssCode(newValue || "");
    // if (fileName === FileNames.SCRIPT) setJsCode(newValue || "");
  };

  // Функція для оновлення Output після натискання "Run Code"
  const handleRunCode = () => {
    setOutputHtml(htmlCode);
    setOutputCss(cssCode);
    // setOutputJs(jsCode);

    setUserCode({
      html: htmlCode,
      css: cssCode,
    });
    // formatCode();
  };

  const clearCode = () => {
    setHtmlCode(initialHtml);
    setCssCode(initialCss);
    // setJsCode(initialJs);
    setOutputHtml(initialHtml);
    setOutputCss(initialCss);
    // setOutputJs(initialJs);
    if (fileName === FileNames.HTML) setValue(initialHtml);
    if (fileName === FileNames.STYLE) setValue(initialCss);
    // if (fileName === FileNames.SCRIPT) setValue(initialJs);
  };

  return (
    <div className={styles.editorContainer}>
      <div className={styles.tabs}>
        <button
          className={styles.toggleBtn}
          onClick={toggleBtn}
          // onClick={() => setIsLessonInfoVisible(!isLessonInfoVisible)}
        >
          {isVisible ? "Приховати деталі уроку" : "Деталі уроку"}
        </button>
        {/* <button
          className={styles.tabButtons}
          disabled={fileName === FileNames.SCRIPT}
          onClick={() => setFileName(FileNames.SCRIPT)}
        >
          script.js
        </button> */}
        <button
          className={styles.tabButtons}
          disabled={fileName === FileNames.STYLE}
          onClick={() => setFileName(FileNames.STYLE)}
        >
          style.css
        </button>
        <button
          className={styles.tabButtons}
          disabled={fileName === FileNames.HTML}
          onClick={() => setFileName(FileNames.HTML)}
        >
          index.html
        </button>
        <LessonNavigation currentLessonId={currentLessonId} />
      </div>

      <div className={styles.container}>
        <div className={styles.editorView}>
          <Editor
            height="82%"
            language={files[fileName].language}
            options={{
              formatOnPaste: true,
              formatOnType: true,
              wordWrap: "on",

              minimap: {
                enabled: false, // Вимкнути мінімапу
              },
            }}
            value={value}
            onMount={onMount}
            onChange={handleChange}
          />
          <div className={styles.bottomBtn}>
            <button className={styles.neonBtn} onClick={handleRunCode}>
              Run Code
            </button>
            <button className={styles.clearBtn} onClick={clearCode}>
              Clear Code
            </button>
            <button className={styles.formatCodeBtn} onClick={formatCode}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 16l5-5-5-5"></path>
                <path d="M21 16l-5-5 5-5"></path>
                <path d="M12 21V3"></path>
              </svg>
              Format Code
            </button>
          </div>
        </div>
        <Output
          html={outputHtml}
          css={outputCss}
          // js={outputJs}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
