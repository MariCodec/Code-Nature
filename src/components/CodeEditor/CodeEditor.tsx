import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Editor, { useMonaco } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { FileNames } from "../../types";
import Output from "./Output";
import LessonNavigation from "../lessonNavigation/LessonNavigation";
import { useResizable } from "../../hooks/useResizable";
import { setupMonacoTheme } from "../../utils/setupMonacoTheme";
import { validateHtmlWithParse5 } from "../../utils/validateHtmlParse5";

import { CodeButtons } from "./CodeButtons";
import "../../utils/monacoSetup";
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
import { checkLesson } from "../../utils/checkLesson";
import { setupMonaco } from "../../utils/monacoSetup";

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
const validateTimerRef = useRef<number | null>(null);

  const [fileName, setFileName] = useState<FileNames>(FileNames.HTML);
  const [output, setOutput] = useState({
    html: lessonCode.html || lesson.initialHtml,
    css: lessonCode.css || lesson.initialCss,
  });
const [htmlError, setHtmlError] = useState<string | null>(null);

  const { containerRef, dividerPosition, startResizing, isOverlayVisible } =
    useResizable();
const focusFirstHtmlError = (): boolean => {
  if (!monaco || !editorRef.current) return false;

  const model = editorRef.current.getModel();
  if (!model) return false;

  const markers = monaco.editor
    .getModelMarkers({ owner: "html-parse5", resource: model.uri })
    .sort((a, b) =>
      a.startLineNumber !== b.startLineNumber
        ? a.startLineNumber - b.startLineNumber
        : a.startColumn - b.startColumn,
    );

  const first = markers[0];
  if (!first) return false;

  editorRef.current.focus();
  editorRef.current.setSelection({
    startLineNumber: first.startLineNumber,
    startColumn: first.startColumn,
    endLineNumber: first.endLineNumber,
    endColumn: first.endColumn,
  });
  editorRef.current.revealRangeInCenter({
    startLineNumber: first.startLineNumber,
    startColumn: first.startColumn,
    endLineNumber: first.endLineNumber,
    endColumn: first.endColumn,
  });

  return true;
};

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
    dispatch(updateHtml({ lessonId: lesson.id, html: value }));

    if (monaco && editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        if (validateTimerRef.current) {
          window.clearTimeout(validateTimerRef.current);
        }

        validateTimerRef.current = window.setTimeout(() => {
          const res = validateHtmlWithParse5(monaco, model, value);
          setHtmlError(res.firstMessage);
        }, 150);
      }
    }
  }

  if (fileName === FileNames.STYLE) {
    dispatch(updateCss({ lessonId: lesson.id, css: value }));
  }
};


  const handleRunCode = () => {
    setOutput({
      html: lessonCode.html || lesson.initialHtml,
      css: lessonCode.css || lesson.initialCss,
    });
  if (htmlError) {
    focusFirstHtmlError();
    return;
  }
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
    // if (monaco && editorRef.current) {
    //   validateHtml(monaco, editorRef.current, lessonCode.html || lesson.initialHtml);
    // }
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

   if (monaco && editorRef.current) {
     const model = editorRef.current.getModel();
     if (model) monaco.editor.setModelMarkers(model, "html-parse5", []);
   }

    dispatch(
      resetTasksForLesson({
        lessonId: lesson.id,
        taskIds:  lesson.tasks.map((t) => t.id),
      })
    );
    
  };
 const handleBeforeMount = (monacoInstance: typeof monaco) => {
   setupMonaco(monacoInstance);
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
            beforeMount={handleBeforeMount}
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
            htmlError={htmlError}
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
