import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Editor, { useMonaco } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { FileNames } from "../../types";
import Output from "./Output";
import LessonNavigation from "../lessonNavigation/LessonNavigation";
import { useResizable } from "../../hooks/useResizable";
import { useHtmlValidation } from "../../hooks/useHtmlValidation";
import { setupMonacoTheme } from "../../utils/setupMonacoTheme";
import { CodeButtons } from "./CodeButtons";

import { RootState } from "../../store";
import {
  selectLessonCode,
  updateHtml,
  updateCss,
  setLessonCode,
} from "../../store/slices/userCodeSlice";

import styles from "./CodeEditor.module.scss";
import { resetTasksForLesson } from "../../store/slices/progressSlice";
import { LessonItem } from "../../types/lessonTypes";
import { isHtmlWellFormed } from "../../utils/validateHtmlCss";
import { checkLesson } from "../../utils/checkLesson";

interface CodeEditorProps {
  lesson: LessonItem;
  toggleBtn: () => void;
  isVisible: boolean;
 
 
}

const CodeEditor: React.FC<CodeEditorProps> = ({

  toggleBtn,
  isVisible,
  lesson,
}) => {
  const dispatch = useDispatch();
const lessonCode = useSelector((state: RootState) =>
  selectLessonCode(state, lesson.id)
);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monaco = useMonaco();

  const [fileName, setFileName] = useState<FileNames>(FileNames.HTML);
  const [output, setOutput] = useState({
    html: lessonCode.html || lesson.initialHtml,
    css: lessonCode.css || lesson.initialCss,
  });
const [htmlError, setHtmlError] = useState<string | null>(null);

  const { containerRef, dividerPosition, startResizing, isOverlayVisible } =
    useResizable();
  const { validateHtml } = useHtmlValidation();

  const onMount = (editorInstance: editor.IStandaloneCodeEditor) => {
    editorRef.current = editorInstance;
    editorInstance.focus();
  };

  useEffect(() => {
    // Обновлюємо output при зміні уроку
    setOutput({
      html: lessonCode.html || lesson.initialHtml,
      css: lessonCode.css || lesson.initialCss,
    });
  }, [lessonCode.html, lessonCode.css, lesson.initialHtml, lesson.initialCss]);

 const handleChange = (newValue: string | undefined) => {
   const value = newValue || "";

   if (fileName === FileNames.HTML) {
     // Зберігаємо HTML у Redux
     dispatch(updateHtml({ lessonId: lesson.id, html: value }));

     // Перевірка валідності HTML
     if (!isHtmlWellFormed(value)) {
       setHtmlError(
         "HTML має помилки: незакриті теги або неправильна структура"
       );
     } else {
       setHtmlError(null);
     }
   }

   if (fileName === FileNames.STYLE) {
     // Зберігаємо CSS у Redux
     dispatch(updateCss({ lessonId: lesson.id, css: value }));
   }
 };

  const handleRunCode = () => {
    setOutput({
      html: lessonCode.html || lesson.initialHtml,
      css: lessonCode.css || lesson.initialCss,
    });
    if (htmlError) return;
    checkLesson({
      lesson,
      userHtml: lessonCode.html || lesson.initialHtml,
      userCss: lessonCode.css || lesson.initialCss,
      dispatch,
    });
    // Зберігаємо код у Redux як "збережений"
    dispatch(
      setLessonCode({
        lessonId: lesson.id,
        html: lessonCode.html || lesson.initialHtml,
        css: lessonCode.css || lesson.initialCss,
      })
    );

    // HTML валідація
    if (monaco && editorRef.current) {
      validateHtml(monaco, editorRef.current, lessonCode.html || lesson.initialHtml);
    }
  };

  const clearCode = () => {
    dispatch(
      setLessonCode({
        lessonId: lesson.id,
        html: lesson.initialHtml,
        css: lesson.initialCss,
      })
    );
    setOutput({ html: lesson.initialHtml, css: lesson.initialCss });
       setHtmlError(null);
    dispatch(
      resetTasksForLesson({
        lessonId: lesson.id,
        taskIds:  lesson.tasks.map((t) => t.id),
      })
    );
    
  };

  const formatCode = () => {
    editorRef.current?.getAction("editor.action.formatDocument")?.run();
  };

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
          className={`${styles.tabButtons} ${
            fileName === FileNames.STYLE ? styles.active : ""
          }`}
          disabled={fileName === FileNames.STYLE}
          onClick={() => setFileName(FileNames.STYLE)}
        >
          style.css
        </button>

        <button
          className={`${styles.tabButtons} ${
            fileName === FileNames.HTML ? styles.active : ""
          }`}
          disabled={fileName === FileNames.HTML}
          onClick={() => setFileName(FileNames.HTML)}
        >
          index.html
        </button>

        <LessonNavigation currentLessonId={lesson.id} />
      </div>

      <div className={styles.container}>
        <div
          className={styles.editorView}
          style={{ width: `${dividerPosition}%` }}
        >
          <Editor
            theme="myCustomTheme"
            language={fileName === FileNames.HTML ? "html" : "css"}
            value={
              fileName === FileNames.HTML
                ? lessonCode.html || lesson.initialHtml
                : lessonCode.css || lesson.initialCss
            }
            onChange={handleChange}
            onMount={onMount}
            options={{
              formatOnPaste: true,
              formatOnType: true,
              wordWrap: "on",
              minimap: { enabled: false },
            }}
          />
          {htmlError && <div className={styles.error}>{htmlError}</div>}
          <CodeButtons
            handleRunCode={handleRunCode}
            clearCode={clearCode}
            formatCode={formatCode}
          />
        </div>

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
