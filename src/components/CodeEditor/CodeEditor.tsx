import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Editor, { useMonaco } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import LessonNavigation from "../lessonNavigation/LessonNavigation";
import { useResizable } from "../../hooks/useResizable";
import { setupMonacoTheme } from "../../utils/setupMonacoTheme";
import { validateHtmlWithParse5 } from "../../utils/validateHtmlParse5";

import { CodeButtons } from "./CodeButtons";
import "../../utils/monacoSetup";
import { AppDispatch, RootState } from "../../store";
import {
  selectIsUserCodeHydrated,
  selectLessonCode,
  setLessonFiles,
  updateLessonFile,
} from "../../store/slices/userCodeSlice";

import styles from "./CodeEditor.module.scss";
import {
  resetTasksForLesson,
  selectTaskStatus,
  touchProgress,
} from "../../store/slices/progressSlice";
import type { LessonDTO } from "../../types/content";
import { checkLesson } from "../../utils/checkLesson";
import type { TaskResult } from "../../domain/runner";
import { useSandbox } from "../../sandbox/useSandbox";
import { getFirstFailureText } from "../../i18n/taskFailureText";
import { uk } from "../../i18n/uk";
import { isQuizRules } from "../../domain/techCheck";
import { setupMonaco } from "../../utils/monacoSetup";
import { saveUserData } from "../../store/thunks/syncThunks";
import { buildLessonFileStates, toSavedFiles } from "../../utils/codeFiles";
import type { LessonRuntime } from "../../runtimes/types";

interface CodeEditorProps {
  lessonDto: LessonDTO;
  /** Runtime уроку з реєстру: він і збирає документ для preview й перевірки. */
  runtime: LessonRuntime;
  toggleBtn: () => void;
  isVisible: boolean;
}

/**
 * Шлях моделі Monaco. Обовʼязково з id уроку: моделі живуть у самому Monaco
 * і переживають розмонтування редактора, тож на голому `index.html` другий урок
 * дістав би буфер першого.
 */
const modelPath = (lessonId: string, fileName: string) => `${lessonId}/${fileName}`;

const CodeEditor: React.FC<CodeEditorProps> = ({
  lessonDto,
  runtime,
  toggleBtn,
  isVisible,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const lessonCode = useSelector((state: RootState) =>
    selectLessonCode(state, lessonDto.id),
  );
  const isCodeHydrated = useSelector(selectIsUserCodeHydrated);
  // Питання техчека зараховані раніше — без них урок ніколи не завершився б.
  const passedTaskIds = useSelector((state: RootState) =>
    selectTaskStatus(state, lessonDto.id),
  );
  const isVideoWatched = useSelector((state: RootState) =>
    Boolean(state.progress.videoStatus[lessonDto.id]),
  );

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monaco = useMonaco();
  const validateTimerRef = useRef<number | null>(null);

  /**
   * Вкладки — це `files[]` уроку, скільки б їх не було й як би вони не звались.
   * Фіксована пара `index.html` + `style.css` мовчки викидала все інше: урок із
   * третім файлом виглядав би як урок із двома, і автор шукав би помилку в контенті.
   */
  const files = useMemo(
    () => buildLessonFileStates(lessonDto.files, lessonCode.savedFiles),
    [lessonDto.files, lessonCode.savedFiles],
  );
  const initialFiles = useMemo(
    () => buildLessonFileStates(lessonDto.files, []),
    [lessonDto.files],
  );

  const [fileName, setFileName] = useState<string>(() => files[0]?.name ?? "");
  const activeFile = files.find((file) => file.name === fileName) ?? files[0] ?? null;

  const [htmlError, setHtmlError] = useState<string | null>(null);
  // Що саме не зійшлося на останньому запуску. null — ще не запускали.
  const [checkResults, setCheckResults] = useState<TaskResult[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  // Пісочниця не відповіла. Окремо від `checkResults`: це не «не зараховано».
  const [hasTimedOut, setHasTimedOut] = useState(false);

  const { frame, problems, run, check, reset } = useSandbox();
  const Preview = runtime.Preview;

  /**
   * Файли для пісочниці читаються через ref, бо вони міняються на кожне
   * натискання клавіші, а перезапускати сторінку учня треба не на кожне,
   * а лише коли він сам попросив — або коли зʼявилось що показувати.
   */
  const filesRef = useRef(files);
  filesRef.current = files;

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

  /**
   * Моделі Monaco живуть у **глобальному** реєстрі, а не в React: `<Editor path>`
   * робить get-or-create, тож наявна модель береться як є, а `defaultValue` до неї
   * більше не застосовується. Не звільняти їх означає дві різні біди.
   *
   * Перша — витік: кожен урок × кожен файл лишає буфер із повною історією undo
   * до перезавантаження сторінки.
   *
   * Друга, гірша — **чужий код після виходу**. Вихід це `navigate("/login")` без
   * перезавантаження, тож `resetUserCode` чистить Redux, а моделі лишаються. Наступний
   * учень у тому ж браузері відкриває той самий урок і бачить роботу попереднього.
   *
   * На вході прибираємо хвости інших уроків, на виході — свої. Приєднану модель
   * пропускаємо: її звільняє сам `@monaco-editor/react`, і забирати її з-під нього
   * означало б гасити редактор на очах.
   */
  useEffect(() => {
    if (!monaco) return;

    const prefix = `/${lessonDto.id}/`;
    const belongsToLesson = (model: editor.ITextModel) =>
      model.uri.path.startsWith(prefix);

    for (const model of monaco.editor.getModels()) {
      if (!belongsToLesson(model)) model.dispose();
    }

    return () => {
      const attached = editorRef.current?.getModel();
      for (const model of monaco.editor.getModels()) {
        if (model !== attached && belongsToLesson(model)) model.dispose();
      }
    };
  }, [monaco, lessonDto.id]);

  /**
   * Перший показ сторінки. Чекаємо на гідратацію з тієї самої причини, що
   * й редактор: до неї в `files` лежить заготовка уроку, і учень побачив би
   * її замість власної роботи. Запит доїде й до `ready` — пісочниця складає
   * такі в чергу, бо iframe вантажиться асинхронно.
   */
  useEffect(() => {
    if (!isCodeHydrated) return;
    run(filesRef.current);
  }, [isCodeHydrated, run]);

  // Урок змінився, або автор переписав `files[]` — активна вкладка могла зникнути.
  useEffect(() => {
    if (files.length === 0) return;
    if (!files.some((file) => file.name === fileName)) setFileName(files[0].name);
  }, [fileName, files]);

  const handleChange = (newValue: string | undefined) => {
    if (!activeFile || !activeFile.isEditable) return;

    const content = newValue ?? "";
    dispatch(
      updateLessonFile({
        lessonId: lessonDto.id,
        file: {
          name: activeFile.name,
          language: activeFile.language,
          content,
        },
      }),
    );

    if (activeFile.language !== "html") return;
    if (!monaco || !editorRef.current) return;

    const model = editorRef.current.getModel();
    if (!model) return;

    if (validateTimerRef.current) window.clearTimeout(validateTimerRef.current);
    validateTimerRef.current = window.setTimeout(() => {
      const result = validateHtmlWithParse5(monaco, model, content);
      setHtmlError(result.firstMessage);
    }, 150);
  };

  // Показуємо перше правило, яке не зійшлося у першому незарахованому завданні:
  // список провалів одразу лякає, а сенс гранулярності саме в конкретиці.
  const firstFailed = checkResults?.find((result) => !result.passed) ?? null;
  const checkFeedback = isRunning
    ? { passed: false, text: uk.editor.running }
    : hasTimedOut
      ? { passed: false, text: uk.taskCheck.timedOut }
      : !checkResults?.length
        ? null
        : firstFailed
          ? {
              passed: false,
              text: getFirstFailureText(firstFailed.rules) ?? uk.taskCheck.notPassed,
            }
          : { passed: true, text: uk.taskCheck.allPassed };

  const handleRunCode = async () => {
    // Показуємо сторінку в будь-якому разі: побачити свою помилку в браузері —
    // теж результат запуску.
    run(files);

    if (htmlError) {
      focusFirstHtmlError();
      return;
    }

    dispatch(touchProgress());
    setIsRunning(true);
    setHasTimedOut(false);

    const outcome = await checkLesson({
      lesson: lessonDto,
      runCheck: check,
      passedTaskIds,
      isVideoWatched,
      dispatch,
    });

    setIsRunning(false);

    if (outcome.status === "done") setCheckResults(outcome.results);
    else {
      // Пісочниці вже немає — її перестворили. Старий результат теж недійсний.
      setCheckResults(null);
      setHasTimedOut(true);
    }

    dispatch(
      setLessonFiles({ lessonId: lessonDto.id, savedFiles: toSavedFiles(files) }),
    );
    void dispatch(saveUserData());
  };

  const clearCode = () => {
    dispatch(
      setLessonFiles({
        lessonId: lessonDto.id,
        savedFiles: toSavedFiles(initialFiles),
      }),
    );
    setHtmlError(null);
    setCheckResults(null);
    setHasTimedOut(false);

    // Перестворення, а не просто перезапуск: `setInterval`, заведений минулим
    // запуском, переживає і Run, і Clear — зупинити його можна лише разом
    // із вікном, у якому він живе.
    reset();
    run(initialFiles);

    // Стан редактора живе в моделях Monaco, а не в Redux, тож самого диспатчу мало:
    // без цього рядка буфер лишився б із написаним, а прогрес — скинутим.
    if (monaco) {
      initialFiles.forEach((file) => {
        const model = monaco.editor.getModel(
          monaco.Uri.parse(modelPath(lessonDto.id, file.name)),
        );
        if (model && model.getValue() !== file.content) model.setValue(file.content);
        if (model) monaco.editor.setModelMarkers(model, "html-parse5", []);
      });
    }

    // Скидаємо лише практику: питання техчека вже складені й скидати їх не можна,
    // інакше «Clear Code» викине учня назад на квіз.
    dispatch(
      resetTasksForLesson({
        lessonId: lessonDto.id,
        taskIds: lessonDto.tasks
          .filter((task) => !isQuizRules(task.rules))
          .map((task) => task.id),
      }),
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
          {isVisible ? uk.editor.hideDetails : uk.editor.showDetails}
        </button>

        {files.map((file) => (
          <button
            key={file.id}
            className={`${styles.tabButtons} ${
              fileName === file.name ? styles.active : ""
            } ${file.isEditable ? "" : styles.tabLocked}`}
            disabled={fileName === file.name}
            title={file.isEditable ? undefined : uk.editor.lockedTab(file.name)}
            onClick={() => setFileName(file.name)}
          >
            {file.name}
            {!file.isEditable && (
              <span className={styles.tabLockIcon} aria-hidden="true">
                🔒
              </span>
            )}
          </button>
        ))}

        <LessonNavigation currentLessonId={lessonDto.id} />
      </div>

      <div className={styles.container}>
        <div
          className={styles.editorView}
          style={{ width: `${dividerPosition}%` }}
        >
          <div className={styles.editorSurface}>
            {!isCodeHydrated ? (
              /*
               * Поки збережений код не піднято, модель створилась би із заготовки
               * уроку — і лишилась би з нею назавжди. Див. коментар до `isHydrated`
               * у `userCodeSlice`.
               */
              <p className={styles.editorEmpty}>{uk.editor.loadingCode}</p>
            ) : activeFile ? (
              <Editor
                height="100%"
                theme="myCustomTheme"
                // `path` дає Monaco окрему модель на файл: своя історія undo,
                // свій курсор і — головне — граф файлів для мовних сервісів,
                // без якого React-уроки лишились би без автодоповнення.
                path={modelPath(lessonDto.id, activeFile.name)}
                defaultLanguage={activeFile.language}
                defaultValue={activeFile.content}
                onChange={handleChange}
                beforeMount={handleBeforeMount}
                onMount={onMount}
                options={{
                  readOnly: !activeFile.isEditable,
                  formatOnPaste: true,
                  formatOnType: true,
                  wordWrap: "on",
                  minimap: { enabled: false },
                }}
              />
            ) : (
              <p className={styles.editorEmpty}>{uk.editor.noFiles}</p>
            )}
          </div>

          {activeFile && !activeFile.isEditable && (
            <p className={styles.lockedNotice} role="note">
              {uk.editor.lockedNotice(activeFile.name)}
            </p>
          )}

          <CodeButtons
            isRunning={isRunning}
            handleRunCode={() => void handleRunCode()}
            clearCode={clearCode}
            formatCode={formatCode}
            htmlError={htmlError}
          />

          {checkFeedback && (
            <p
              className={`${styles.checkFeedback} ${
                checkFeedback.passed ? styles.checkFeedbackOk : ""
              }`}
              role="status"
            >
              {checkFeedback.text}
            </p>
          )}
        </div>

        <div className={styles.resizer} onMouseDown={startResizing} />

        <div
          className={styles.browserWindow}
          style={{ width: `${100 - dividerPosition}%` }}
        >
          {Preview && <Preview frame={frame} problems={problems} />}
        </div>
      </div>
      {isOverlayVisible && <div className={styles.overlay} />}
    </div>
  );
};

export default CodeEditor;
