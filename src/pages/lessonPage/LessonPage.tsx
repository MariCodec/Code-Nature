import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { AppDispatch, RootState } from "../../store";

import CodeEditor from "../../components/CodeEditor/CodeEditor";
import TaskList from "../../components/taskList/TasksList";
import LessonHeader from "../../components/lessonHeader/LessonHeader";

import styles from "./LessonPage.module.scss";
import {
  fetchCourseModules,
  fetchCoursesByTrack,
  fetchLessonById,
  fetchModuleLessons,
  selectContentError,
  selectCourseModules,
  selectCoursesByTrack,
  selectLessonById,
  selectLessonStatus,
} from "../../store/slices/contentSlice";
import { saveUserData } from "../../store/thunks/syncThunks";
import {
  markLessonAsCompleted,
  selectIsProgressHydrated,
  setCurrentLesson,
} from "../../store/slices/progressSlice";
import type { LessonVideoDTO } from "../../types/content";
import LessonNavigation from "../../components/lessonNavigation/LessonNavigation";
import LessonStepsBar from "../../components/lessonSteps/LessonStepsBar";
import ModuleCompleteOverlay from "../../components/moduleProgress/ModuleCompleteOverlay";
import { useModuleProgression } from "../../hooks/useModuleProgression";
import TechCheckQuiz from "../../components/techCheck/TechCheckQuiz";
import {
  isPracticeUnlocked,
  splitTechCheckTasks,
} from "../../domain/techCheck";
import { buildStudentLessonPath } from "../../utils/courseMapping";
import { markTaskAsCompleted } from "../../store/slices/progressSlice";
import TheoryBlocks from "../../components/theory/TheoryBlocks";
import { getLessonRuntime } from "../../runtimes/registry";
import { getLessonCompletion } from "../../domain/lessonCompletion";
import { getLessonSteps } from "../../domain/lessonSteps";
import { uk } from "../../i18n/uk";

const getVideoEmbedUrl = (video: LessonVideoDTO): string | null => {
  if (!video.sourceUrl) return null;

  try {
    const url = new URL(video.sourceUrl);

    if (video.provider === "youtube") {
      const videoId =
        url.hostname.includes("youtu.be")
          ? url.pathname.replace("/", "")
          : url.searchParams.get("v");

      return videoId ? `https://www.youtube.com/embed/${videoId}` : video.sourceUrl;
    }

    if (video.provider === "vimeo") {
      const videoId = url.pathname.split("/").filter(Boolean).at(-1);
      return videoId ? `https://player.vimeo.com/video/${videoId}` : video.sourceUrl;
    }
  } catch {
    return video.sourceUrl;
  }

  return video.sourceUrl;
};

const isFileVideo = (video: LessonVideoDTO) =>
  video.provider === "upload" || video.provider === "mux" || video.provider === "external";

/**
 * Крок «Відео» — **єдине** місце, де в уроці живе плеєр.
 *
 * Їх було три: екран-інтро на весь екран, картка в бічній панелі й список
 * на сторінці уроку без редактора. Повернутись до відео під час практики
 * тепер можна кроком, а не другим плеєром (розділ 4).
 *
 * Заглушки «відео буде додано» тут немає й бути не може: крок існує лише тоді,
 * коли є джерело, і цю умову рахує `getLessonSteps`, а не розмітка.
 */
const LessonVideoStep = ({ videos }: { videos: LessonVideoDTO[] }) => {
  const playable = [...videos]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .filter((video) => getVideoEmbedUrl(video) !== null);

  return (
    <section className={styles.videoSection}>
      {playable.map((video) => {
        const source = getVideoEmbedUrl(video) as string;

        return (
          <article key={video.id} className={styles.videoCard}>
            <div className={styles.videoCopy}>
              <h2>{video.title}</h2>
              {video.description && <p>{video.description}</p>}
            </div>

            {isFileVideo(video) ? (
              <video
                className={styles.videoPlayer}
                controls
                preload="metadata"
                poster={video.thumbnailUrl ?? undefined}
                src={source}
              >
                {video.captionsUrl && (
                  <track
                    kind="captions"
                    src={video.captionsUrl}
                    srcLang="uk"
                    label="Українська"
                  />
                )}
              </video>
            ) : (
              <iframe
                className={styles.videoPlayer}
                src={source}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}

            {video.transcript && (
              <details className={styles.transcript}>
                <summary>Транскрипт</summary>
                <p>{video.transcript}</p>
              </details>
            )}
          </article>
        );
      })}
    </section>
  );
};

/**
 * Крок «Теорія» — головна колонка шириною для читання, а не бічна шухляда.
 *
 * Шухляда тихо формувала спосіб писати уроки: автор, який бачить теорію
 * згорнутою й закритою за замовчуванням, пише її як необовʼязкову. Той самий
 * механізм, через який рушій до Фази 3 формував програму курсу, — тільки тут
 * формував макет (розділ 4).
 */
const LessonTheoryStep = ({
  blocks,
}: {
  blocks: React.ComponentProps<typeof TheoryBlocks>["blocks"];
}) => (
  <section className={styles.readingColumn}>
    <TheoryBlocks blocks={blocks} />
  </section>
);

const LessonPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [stepIndex, setStepIndex] = useState(0);
  const [isModuleSummaryDismissed, setIsModuleSummaryDismissed] = useState(false);
  const navigate = useNavigate();
  const { courseId, moduleId, id } = useParams<{
    courseId?: string;
    moduleId?: string;
    id?: string;
  }>();
  const frontendCourses = useSelector((state: RootState) =>
    selectCoursesByTrack(state, "frontend"),
  );
  const selectedCourse = courseId
    ? frontendCourses.find((course) => course.id === courseId) ?? null
    : null;
  const courseModules = useSelector((state: RootState) =>
    selectedCourse ? selectCourseModules(state, selectedCourse.id) : [],
  );
  const lessonDto = useSelector((state: RootState) =>
    id ? selectLessonById(state, id) : null,
  );
  const lessonStatus = useSelector((state: RootState) =>
    id ? selectLessonStatus(state, id) : "idle",
  );
  const isProgressHydrated = useSelector(selectIsProgressHydrated);
  const completedLessons = useSelector(
    (state: RootState) => state.progress.completedLessons,
  );
  const taskStatus = useSelector((state: RootState) => state.progress.taskStatus);
  const contentError = useSelector(selectContentError);
  const moduleProgression = useModuleProgression(courseId, moduleId);
  const currentModule =
    courseModules.find((module) => module.id === moduleId) ?? null;

  useEffect(() => {
    void dispatch(fetchCoursesByTrack("frontend"));
  }, [dispatch]);

  useEffect(() => {
    if (!selectedCourse) return;
    void dispatch(fetchCourseModules(selectedCourse.id));
  }, [dispatch, selectedCourse]);

  useEffect(() => {
    if (moduleId) {
      void dispatch(fetchModuleLessons(moduleId));
      return;
    }

    courseModules.forEach((module) => {
      void dispatch(fetchModuleLessons(module.id));
    });
  }, [courseModules, dispatch, moduleId]);

  useEffect(() => {
    if (!id) return;
    void dispatch(fetchLessonById(id));
  }, [dispatch, id]);

  useEffect(() => {
    // Чекаємо на гідратацію, і не лише заради збереження: `hydrateProgress`
    // замінює весь стан прогресу цілим обʼєктом, тож `setCurrentLesson`,
    // зроблений до неї, був би затертий — і «продовжити навчання» вказувало б
    // на попередній урок після відкриття прямого посилання.
    if (!id || !isProgressHydrated) return;
    dispatch(setCurrentLesson(id));
    void dispatch(saveUserData());
  }, [dispatch, id, isProgressHydrated]);

  useEffect(() => {
    setStepIndex(0);
    setIsModuleSummaryDismissed(false);
  }, [id]);

  if (contentError) return <h2>{contentError}</h2>;
  if (lessonStatus === "loading" || (id && !lessonDto)) return <h2>Завантаження уроку...</h2>;
  if (
    !courseId ||
    !moduleId ||
    !lessonDto ||
    lessonDto.courseId !== courseId ||
    lessonDto.moduleId !== moduleId
  ) {
    return <h2>Урок не знайдено</h2>;
  }

  /**
   * Тип уроку читається з реєстру, а не вгадується по полях.
   *
   * Було `runtimeType === "video" && files.length === 0` — здогадка, яка помиляється
   * двічі: урок-відео з файлом дістав би редактор, а `theory-only` дістав би його
   * завжди. Реєстр відповідає на це питання один раз і для всіх типів, і саме
   * тому «додати новий тип уроку = один запис, нуль правок у сторінці» (розділ 5).
   */
  const runtime = getLessonRuntime(lessonDto.runtimeType);
  const isLessonFinished = completedLessons.includes(lessonDto.id);

  /**
   * Єдина дія учня на уроці без завдань. Вона повідомляє **один факт** —
   * «пройдено», — а чи цього досить, вирішує правило з домену: на уроці
   * з невиконаними завданнями `getLessonCompletion` поверне `blockedBy`
   * і нічого не зарахує.
   */
  const finishLessonWithoutTasks = () => {
    const completion = getLessonCompletion({
      validationType: lessonDto.validationType,
      tasks: lessonDto.tasks,
      taskStatus: taskStatus[lessonDto.id],
      isMarkedDone: true,
    });

    if (completion.completed) dispatch(markLessonAsCompleted(lessonDto.id));
    void dispatch(saveUserData());
  };

  // Підсумок показуємо лише на останньому елементі модуля: інакше він вискакував би
  // на будь-якому уроці, відкритому повторно після завершення модуля.
  const lastModuleItem = moduleProgression.state.ordered.at(-1) ?? null;
  const shouldShowModuleSummary =
    moduleProgression.state.isModuleComplete &&
    lastModuleItem?.id === lessonDto.id &&
    !isModuleSummaryDismissed;

  // Техчек: спершу питання, практика відкривається лише після всіх правильних відповідей.
  const { questions: quizQuestions, practice: practiceTasks } = splitTechCheckTasks(
    lessonDto.tasks,
  );
  const passedTaskIds = taskStatus[lessonDto.id] ?? {};

  if (
    lessonDto.lessonKind === "tech_check" &&
    quizQuestions.length > 0 &&
    !isPracticeUnlocked(quizQuestions, passedTaskIds)
  ) {
    return (
      <TechCheckQuiz
        lessonTitle={lessonDto.title}
        questions={quizQuestions}
        passedTaskIds={passedTaskIds}
        buildReviewHref={(reviewLessonId) =>
          buildStudentLessonPath(courseId, moduleId, reviewLessonId)
        }
        onPass={(taskId) => {
          dispatch(markTaskAsCompleted({ lessonId: lessonDto.id, taskId }));
          void dispatch(saveUserData());
        }}
      />
    );
  }

  /**
   * Кроки уроку — з домену, а не з умов у розмітці.
   *
   * `hasEditor` беремо в реєстру: сторінка питає, а не вгадує по `runtimeType`.
   * Урок, якого реєстр не знає, редактора не має — і тоді крок практики
   * не зʼявиться навіть за наявності завдань.
   */
  const steps = getLessonSteps({
    videos: lessonDto.videos,
    theoryBlocks: lessonDto.theoryBlocks,
    tasks: lessonDto.tasks,
    hasEditor: Boolean(runtime?.hasEditor),
  });
  // Крок міг зникнути разом зі зміною уроку швидше, ніж спрацює ефект скидання.
  const currentStep = steps[stepIndex] ?? steps[0] ?? null;
  const currentIndex = currentStep ? steps.indexOf(currentStep) : 0;
  const isPracticeStep = currentStep?.kind === "practice";

  const visibleTasks = (
    lessonDto.lessonKind === "tech_check" ? practiceTasks : lessonDto.tasks
  ).map((task) => ({ id: task.id, text: task.description, hints: task.hints }));

  return (
    <div className={styles.lessonPage}>
      <header className={styles.lessonTopBar}>
        <LessonHeader
          title={lessonDto.title}
          description={lessonDto.description}
          lessonKind={lessonDto.lessonKind}
          moduleLessonsCount={moduleProgression.state.totalLessonsCount}
        />
        <LessonStepsBar
          steps={steps}
          currentIndex={currentIndex}
          onSelect={setStepIndex}
        />
      </header>

      {shouldShowModuleSummary && (
        <ModuleCompleteOverlay
          moduleTitle={currentModule?.title ?? "Модуль"}
          lessonsCount={moduleProgression.state.totalLessonsCount}
          hasTechCheck={Boolean(moduleProgression.state.techCheck)}
          nextModuleTitle={moduleProgression.nextModule?.title ?? null}
          onNext={() =>
            navigate(
              moduleProgression.nextModule
                ? `/student/courses/${courseId}`
                : "/student/learning",
            )
          }
          onDismiss={() => setIsModuleSummaryDismissed(true)}
        />
      )}

      <div
        className={`${styles.stepBody} ${isPracticeStep ? styles.stepBodyPractice : ""}`}
      >
        {!currentStep && (
          /* Нуль кроків — недописаний контент. Чесний напис кращий за каркас
             навколо порожнечі: учень інакше вирішить, що зламався застосунок. */
          <p className={styles.emptyLesson}>{uk.lessonSteps.empty}</p>
        )}

        {currentStep?.kind === "video" && <LessonVideoStep videos={lessonDto.videos} />}

        {currentStep?.kind === "theory" && (
          <LessonTheoryStep blocks={lessonDto.theoryBlocks} />
        )}

        {currentStep?.kind === "practice" && runtime && (
          <>
            <aside className={styles.tasksPanel}>
              <TaskList lessonId={lessonDto.id} tasks={visibleTasks} />
            </aside>
            <CodeEditor key={lessonDto.id} lessonDto={lessonDto} runtime={runtime} />
          </>
        )}

        {/* Тип уроку, для якого реалізації ще немає: `code-output`, `spa-preview`.
            Порожній редактор тут був би гіршим за чесний напис — учень вирішив би,
            що зламався застосунок. */}
        {!runtime && currentStep && (
          <p className={styles.emptyLesson}>
            {uk.editor.runtimeUnsupported(lessonDto.runtimeType)}
          </p>
        )}
      </div>

      <footer className={styles.lessonFooter}>
        <div className={styles.stepNav}>
          <button
            type="button"
            className={styles.stepButton}
            disabled={currentIndex === 0}
            onClick={() => setStepIndex(currentIndex - 1)}
          >
            {uk.lessonSteps.back}
          </button>

          {currentIndex < steps.length - 1 ? (
            <button
              type="button"
              className={`${styles.stepButton} ${styles.stepButtonAccent}`}
              onClick={() => setStepIndex(currentIndex + 1)}
            >
              {uk.lessonSteps.next}
            </button>
          ) : (
            /* Останній крок уроку без завдань завершує сам урок. Кнопка тут
               тимчасова: «Далі» має робити це без окремої «Пройдено» — 4b.8. */
            !isPracticeStep && (
              <button
                type="button"
                className={`${styles.stepButton} ${styles.stepButtonAccent}`}
                disabled={isLessonFinished}
                onClick={finishLessonWithoutTasks}
              >
                {isLessonFinished ? uk.videoLesson.finished : uk.videoLesson.finish}
              </button>
            )
          )}
        </div>

        <LessonNavigation currentLessonId={lessonDto.id} />
      </footer>
    </div>
  );
};

export default LessonPage;
