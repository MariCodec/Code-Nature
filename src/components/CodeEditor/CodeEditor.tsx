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
const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [dividerPosition, setDividerPosition] = useState(50); // % ширини
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

useEffect(() => {
  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current || !containerRef.current) return;

    // отримуємо координати саме блоку з редактором і Output
    const rect = containerRef.current
      .querySelector(`.${styles.container}`)
      ?.getBoundingClientRect();

    if (!rect) return;

    // враховуємо зсув контейнера відносно екрана
    const newPosition = ((e.clientX - rect.left) / rect.width) * 100;

    if (newPosition > 30 && newPosition < 70) {
      setDividerPosition(newPosition);
    }
  };

  const handleMouseUp = () => {
    isResizing.current = false;
    setIsOverlayVisible(false);
    document.body.style.cursor = "default";
    document.body.style.userSelect = "auto";
  };

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);

  return () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };
}, []);


 const startResizing = () => {
   isResizing.current = true;
      setIsOverlayVisible(true);
   document.body.style.cursor = "col-resize";
   document.body.style.userSelect = "none";

 };
  
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
const [decorations, setDecorations] = useState<string[]>([]);

const getHtmlErrorDecorations = (
  monaco: typeof import("monaco-editor"),
  editorInstance: editor.IStandaloneCodeEditor,
  html: string
) => {
  if (!monaco || !editorInstance) return;
  const model = editorInstance.getModel();
  if (!model) return;

  const newDecorations: editor.IModelDeltaDecoration[] = [];
  const stack: { tag: string; index: number }[] = [];
  const tagRegex = /<\/?([a-zA-Z0-9]+)[^>]*>/g;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const isClosing = match[0][1] === "/";
    const startPos = model.getPositionAt(match.index);
    const endPos = model.getPositionAt(match.index + match[0].length);

    if (!isClosing) {
      stack.push({ tag, index: match.index });
    } else {
      const last = stack.pop();
      if (!last || last.tag !== tag) {
        newDecorations.push({
          range: new monaco.Range(
            startPos.lineNumber,
            startPos.column,
            endPos.lineNumber,
            endPos.column
          ),
          options: { inlineClassName: "underline-error" },
        });
      }
    }
  }

  // Незакриті теги
  stack.forEach((item) => {
    const startPos = model.getPositionAt(item.index);
    const endPos = model.getPositionAt(item.index + item.tag.length + 2);
    newDecorations.push({
      range: new monaco.Range(
        startPos.lineNumber,
        startPos.column,
        endPos.lineNumber,
        endPos.column
      ),
      options: { inlineClassName: "underline-error" },
    });
  });

  // Замінюємо старі декорації на нові
  const newIds = editorInstance.deltaDecorations(decorations, newDecorations);
  setDecorations(newIds);
};


// Повертає масив декорацій для Monaco

  const handleRunCode = () => {
    setOutput({ ...code });
    setUserCode({ ...code });
  if (monaco && editorRef.current) {
    getHtmlErrorDecorations(monaco, editorRef.current, code.html);
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

          <div className={styles.bottomBtn}>
            <button className={styles.runBtn} onClick={handleRunCode}>
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
