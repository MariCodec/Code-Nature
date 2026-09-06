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
  markLessonVideoAsWatched,
  setCurrentLesson,
} from "../../store/slices/progressSlice";
import type { LessonVideoDTO } from "../../types/content";
import LessonNavigation from "../../components/lessonNavigation/LessonNavigation";
import ModuleCompleteOverlay from "../../components/moduleProgress/ModuleCompleteOverlay";
import { useModuleProgression } from "../../hooks/useModuleProgression";
import TechCheckQuiz from "../../components/techCheck/TechCheckQuiz";
import {
  isPracticeUnlocked,
  splitTechCheckTasks,
} from "../../domain/techCheck";
import { buildStudentLessonPath } from "../../utils/courseMapping";
import { markTaskAsCompleted } from "../../store/slices/progressSlice";

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

const LessonIntroScreen = ({
  lessonTitle,
  video,
  onContinue,
}: {
  lessonTitle: string;
  video: LessonVideoDTO;
  onContinue: () => void;
}) => {
  const [isFileVideoFinished, setIsFileVideoFinished] = useState(false);
  const source = getVideoEmbedUrl(video);
  const shouldWaitForVideoEnd = Boolean(source && isFileVideo(video));
  const canContinue = !shouldWaitForVideoEnd || isFileVideoFinished;

  return (
    <main className={styles.lessonIntroPage}>
      <section className={styles.lessonIntroCard}>
        <p className={styles.introEyebrow}>Початок уроку</p>
        <h1>Вітаю на уроці "{lessonTitle}"</h1>
        <p className={styles.introLead}>
          Перед практикою уважно подивись коротке пояснення. Після цього
          відкриється редактор, завдання і preview.
        </p>

        <div className={styles.introVideoFrame}>
          {source ? (
            isFileVideo(video) ? (
              <video
                className={styles.introVideo}
                controls
                preload="metadata"
                poster={video.thumbnailUrl ?? undefined}
                src={source}
                onEnded={() => setIsFileVideoFinished(true)}
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
                className={styles.introVideo}
                src={source}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )
          ) : (
            <div className={styles.introVideoPlaceholder}>
              <strong>Відео буде додано</strong>
              <span>
                Тут буде AI-відео або YouTube-пояснення для цього уроку.
              </span>
            </div>
          )}
        </div>

        <button
          className={styles.startPracticeButton}
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
        >
          {canContinue
            ? "Перейти до практики"
            : "Додивись відео, щоб перейти до практики"}
        </button>
      </section>
    </main>
  );
};

const LessonVideos = ({ videos }: { videos: LessonVideoDTO[] }) => {
  const orderedVideos = [...videos].sort((a, b) => a.orderIndex - b.orderIndex);

  if (orderedVideos.length === 0) return null;

  return (
    <section className={styles.videoSection}>
      {orderedVideos.map((video) => {
        const source = getVideoEmbedUrl(video);

        return (
          <article key={video.id} className={styles.videoCard}>
            <div className={styles.videoCopy}>
              <h2>{video.title}</h2>
              {video.description && <p>{video.description}</p>}
            </div>

            {source ? (
              isFileVideo(video) ? (
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
              )
            ) : (
              <div className={styles.videoPlaceholder}>
                <strong>Відео буде додано</strong>
                <span>Поки що це місце для короткого пояснення теми.</span>
              </div>
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

const LessonSidebarVideo = ({
  video,
  onReplayIntro,
}: {
  video: LessonVideoDTO;
  onReplayIntro: () => void;
}) => {
  const source = getVideoEmbedUrl(video);

  return (
    <section className={styles.sidebarVideoCard} aria-label="Відео уроку">
      <div className={styles.sidebarVideoHeader}>
        <span>Відеоурок</span>
        <button type="button" onClick={onReplayIntro}>
          Відкрити на весь екран
        </button>
      </div>

      {source ? (
        isFileVideo(video) ? (
          <video
            className={styles.sidebarVideoPlayer}
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
            className={styles.sidebarVideoPlayer}
            src={source}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )
      ) : (
        <div className={styles.sidebarVideoPlaceholder}>
          <strong>Відео буде додано</strong>
          <span>Тут буде коротке пояснення перед практикою.</span>
        </div>
      )}
    </section>
  );
};

const LessonPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [isLessonInfoVisible, setIsLessonInfoVisible] = useState(false);
  const [isPracticeStarted, setIsPracticeStarted] = useState(false);
  const [isVideoReviewMode, setIsVideoReviewMode] = useState(false);
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
  const videoStatus = useSelector((state: RootState) => state.progress.videoStatus);
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
    if (!id) return;
    dispatch(setCurrentLesson(id));
    void dispatch(saveUserData());
  }, [dispatch, id]);

  useEffect(() => {
    setIsPracticeStarted(false);
    setIsVideoReviewMode(false);
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

  const toggleBtn = () => setIsLessonInfoVisible((prev) => !prev);
  const isVideoOnlyLesson =
    lessonDto.runtimeType === "video" && lessonDto.files.length === 0;
  const introVideo = [...lessonDto.videos].sort(
    (a, b) => a.orderIndex - b.orderIndex,
  )[0];
  const isIntroVideoWatched = Boolean(videoStatus[lessonDto.id]);
  const startPractice = () => {
    dispatch(markLessonVideoAsWatched(lessonDto.id));
    setIsPracticeStarted(true);
    setIsVideoReviewMode(false);
    void dispatch(saveUserData());
  };
  // Підсумок показуємо лише на останньому елементі модуля: інакше він вискакував би
  // на будь-якому уроці, відкритому повторно після завершення модуля.
  const lastModuleItem = moduleProgression.state.ordered.at(-1) ?? null;
  const shouldShowModuleSummary =
    moduleProgression.state.isModuleComplete &&
    lastModuleItem?.id === lessonDto.id &&
    !isModuleSummaryDismissed;

  const shouldShowIntroBeforePractice =
    lessonDto.lessonKind === "lesson" &&
    lessonDto.runtimeType !== "video" &&
    Boolean(introVideo) &&
    ((!isIntroVideoWatched && !isPracticeStarted) || isVideoReviewMode);

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

  if (shouldShowIntroBeforePractice && introVideo) {
    return (
      <LessonIntroScreen
        lessonTitle={lessonDto.title}
        video={introVideo}
        onContinue={startPractice}
      />
    );
  }

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.lessonInfo} ${isLessonInfoVisible ? styles.show : ""}`}
      >
        <div className={styles.sidebarCard}>
          <LessonHeader
            title={lessonDto.title}
            description={lessonDto.description}
            lessonKind={lessonDto.lessonKind}
            moduleLessonsCount={moduleProgression.state.totalLessonsCount}
          />
          {introVideo && (
            <LessonSidebarVideo
              video={introVideo}
              onReplayIntro={() => setIsVideoReviewMode(true)}
            />
          )}
          <TaskList
            lessonId={lessonDto.id}
            tasks={(lessonDto.lessonKind === "tech_check"
              ? practiceTasks
              : lessonDto.tasks
            ).map((task) => ({
              id: task.id,
              text: task.description,
            }))}
          />
        </div>
      </div>

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

      {isVideoOnlyLesson ? (
        <main className={styles.videoOnlyPage}>
          <div className={styles.videoOnlyTopBar}>
            <button className={styles.detailsButton} onClick={toggleBtn}>
              {isLessonInfoVisible ? "Приховати деталі уроку" : "Деталі уроку"}
            </button>
            <LessonNavigation currentLessonId={lessonDto.id} />
          </div>
          <LessonVideos videos={lessonDto.videos} />
        </main>
      ) : (
        <CodeEditor
          key={lessonDto.id}
          lessonDto={lessonDto}
          toggleBtn={toggleBtn}
          isVisible={isLessonInfoVisible}
        />
      )}
    </div>
  );
};

export default LessonPage;
