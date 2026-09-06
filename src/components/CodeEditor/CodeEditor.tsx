import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Editor, { useMonaco } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import Output from "./Output";
import LessonNavigation from "../lessonNavigation/LessonNavigation";
import { useResizable } from "../../hooks/useResizable";
import { setupMonacoTheme } from "../../utils/setupMonacoTheme";
import { validateHtmlWithParse5 } from "../../utils/validateHtmlParse5";

import { CodeButtons } from "./CodeButtons";
import "../../utils/monacoSetup";
import { AppDispatch, RootState } from "../../store";
import {
  selectLessonCode,
  updateHtml,
  updateCss,
  setLessonCode,
} from "../../store/slices/userCodeSlice";

import styles from "./CodeEditor.module.scss";
import {
  resetTasksForLesson,
  selectTaskStatus,
  touchProgress,
} from "../../store/slices/progressSlice";
import type { LessonDTO } from "../../types/content";
import { checkLesson } from "../../utils/checkLesson";
import { isQuizRules } from "../../domain/techCheck";
import { setupMonaco } from "../../utils/monacoSetup";
import { saveUserData } from "../../store/thunks/syncThunks";
import {
  getInitialCssFromLessonFiles,
  getInitialHtmlFromLessonFiles,
} from "../../utils/lessonFiles";
import {
  buildSavedFiles,
  getCssFromSavedFiles,
  getHtmlFromSavedFiles,
  getSavedFileContent,
} from "../../utils/codeFiles";

interface CodeEditorProps {
  lessonDto: LessonDTO;
  toggleBtn: () => void;
  isVisible: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  lessonDto,
  toggleBtn,
  isVisible,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const lessonCode = useSelector((state: RootState) =>
    selectLessonCode(state, lessonDto.id),
  );
  // Питання техчека зараховані раніше — без них урок ніколи не завершився б.
  const passedTaskIds = useSelector((state: RootState) =>
    selectTaskStatus(state, lessonDto.id),
  );
  const fallbackHtml = getInitialHtmlFromLessonFiles(lessonDto.files);
  const fallbackCss = getInitialCssFromLessonFiles(lessonDto.files);
  const effectiveSavedFiles =
    lessonCode.savedFiles.length > 0
      ? lessonCode.savedFiles
      : buildSavedFiles(fallbackHtml, fallbackCss);
  const currentHtml = getHtmlFromSavedFiles(effectiveSavedFiles) || fallbackHtml;
  const currentCss = getCssFromSavedFiles(effectiveSavedFiles) || fallbackCss;
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monaco = useMonaco();
const validateTimerRef = useRef<number | null>(null);

  const supportedFiles = lessonDto.files
    .filter(
    (file) => file.name === "index.html" || file.name === "style.css",
    )
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const currentFiles = supportedFiles.map((file) => ({
    ...file,
    content: getSavedFileContent(effectiveSavedFiles, file.name) || file.initialContent,
  }));

  const [fileName, setFileName] = useState<string>(() => supportedFiles[0]?.name ?? "index.html");
  const [output, setOutput] = useState({
    html: currentHtml,
    css: currentCss,
  });
const [htmlError, setHtmlError] = useState<string | null>(null);
  const activeFile =
    currentFiles.find((file) => file.name === fileName) ?? currentFiles[0] ?? null;

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
      html: currentHtml,
      css: currentCss,
    });
  }, [currentHtml, currentCss]);

  useEffect(() => {
    if (!activeFile && supportedFiles[0]) {
      setFileName(supportedFiles[0].name);
      return;
    }

    if (activeFile && !currentFiles.some((file) => file.name === activeFile.name) && supportedFiles[0]) {
      setFileName(supportedFiles[0].name);
    }
  }, [activeFile, currentFiles, supportedFiles]);

const handleChange = (newValue: string | undefined) => {
  const value = newValue || "";

  if (activeFile?.name === "index.html") {
    dispatch(updateHtml({ lessonId: lessonDto.id, html: value }));

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

  if (activeFile?.name === "style.css") {
    dispatch(updateCss({ lessonId: lessonDto.id, css: value }));
  }
};


  const handleRunCode = () => {
    setOutput({
      html: currentHtml,
      css: currentCss,
    });
  if (htmlError) {
    focusFirstHtmlError();
    return;
  }
    dispatch(touchProgress());
    checkLesson({
      lessonId: lessonDto.id,
      tasks: lessonDto.tasks,
      userHtml: currentHtml,
      userCss: currentCss,
      passedTaskIds,
      dispatch,
    });
    // Зберігаємо код у Redux як "збережений"
    dispatch(
      setLessonCode({
        lessonId: lessonDto.id,
        html: currentHtml,
        css: currentCss,
      })
    );
dispatch(saveUserData());
    // HTML валідація
    // if (monaco && editorRef.current) {
    //   validateHtml(monaco, editorRef.current, lessonCode.html || lesson.initialHtml);
    // }
  };

  const clearCode = () => {
    dispatch(
      setLessonCode({
        lessonId: lessonDto.id,
        html: fallbackHtml,
        css: fallbackCss,
      })
    );
    setOutput({ html: fallbackHtml, css: fallbackCss });
   setHtmlError(null);

   if (monaco && editorRef.current) {
     const model = editorRef.current.getModel();
     if (model) monaco.editor.setModelMarkers(model, "html-parse5", []);
   }

    // Скидаємо лише практику: питання техчека вже складені й скидати їх не можна,
    // інакше «Clear Code» викине учня назад на квіз.
    dispatch(
      resetTasksForLesson({
        lessonId: lessonDto.id,
        taskIds: lessonDto.tasks
          .filter((task) => !isQuizRules(task.rules))
          .map((task) => task.id),
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

        {currentFiles.map((file) => (
          <button
            key={file.id}
            className={`${styles.tabButtons} ${
              fileName === file.name ? styles.active : ""
            }`}
            disabled={fileName === file.name}
            onClick={() => setFileName(file.name)}
          >
            {file.name}
          </button>
        ))}

        <LessonNavigation currentLessonId={lessonDto.id} />
      </div>

      <div className={styles.container}>
        <div
          className={styles.editorView}
          style={{ width: `${dividerPosition}%` }}
        >
          <Editor
            theme="myCustomTheme"
            language={activeFile?.language ?? "html"}
            value={activeFile?.content ?? ""}
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
