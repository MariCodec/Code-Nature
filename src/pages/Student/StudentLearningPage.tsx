import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import styles from "./StudentLearningPage.module.scss";
import type { AppDispatch, RootState } from "../../store";
import {
  fetchCourseModules,
  fetchCoursesByTrack,
  fetchLessonById,
  fetchModuleLessons,
  fetchTracks,
  selectContentError,
  selectCourseLessons,
  selectCourseModules,
  selectCoursesByTrack,
  selectTracks,
} from "../../store/slices/contentSlice";
import {
  buildStudentLessonPath,
  buildStudentTechCheckPath,
} from "../../utils/courseMapping";
import {
  countCompletedTasks,
  getCurrentItem,
  getItemAccess,
  getModuleState,
} from "../../domain/progression";

const TRACK_SLUG = "frontend";

const StudentLearningPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [expandedCourseIds, setExpandedCourseIds] = useState<string[]>([]);
  const [hasTouchedCourseAccordion, setHasTouchedCourseAccordion] = useState(false);
  // Модулі згорнуті; сам відкривається лише той, у якому учень зараз.
  const [moduleOverrides, setModuleOverrides] = useState<Record<string, boolean>>({});
  const toggleModule = (moduleId: string, isOpen: boolean) =>
    setModuleOverrides((prev) => ({ ...prev, [moduleId]: !isOpen }));
  const tracks = useSelector(selectTracks);
  const courses = useSelector((state: RootState) =>
    selectCoursesByTrack(state, TRACK_SLUG),
  );
  const completedLessons = useSelector(
    (state: RootState) => state.progress.completedLessons,
  );
  const taskStatus = useSelector((state: RootState) => state.progress.taskStatus);
  const videoStatus = useSelector((state: RootState) => state.progress.videoStatus);
  const lessonById = useSelector((state: RootState) => state.content.lessonById);
  const contentError = useSelector(selectContentError);
  const courseSummaries = useSelector((state: RootState) =>
    courses.map((course) => {
      const modules = selectCourseModules(state, course.id);
      const lessons = selectCourseLessons(state, course.id);
      const regularLessons = lessons.filter((lesson) => lesson.lessonKind === "lesson");
      const techChecks = lessons.filter((lesson) => lesson.lessonKind === "tech_check");
      const completedCount = regularLessons.filter((lesson) =>
        state.progress.completedLessons.includes(lesson.id),
      ).length;

      return {
        course,
        modules,
        lessons: regularLessons,
        techChecks,
        completedCount,
      };
    }),
  );
  const moduleIdsKey = courseSummaries
    .flatMap((item) => item.modules)
    .map((module) => module.id)
    .join(",");
  const lessonIdsKey = courseSummaries
    .flatMap((item) => item.lessons)
    .map((lesson) => lesson.id)
    .join(",");

  const activeTrack = tracks.find((track) => track.slug === TRACK_SLUG) ?? null;
  const totalLessons = courseSummaries.reduce(
    (sum, item) => sum + item.lessons.length,
    0,
  );
  const totalModules = courseSummaries.reduce(
    (sum, item) => sum + item.modules.length,
    0,
  );
  const completedCount = courseSummaries.reduce(
    (sum, item) => sum + item.completedCount,
    0,
  );
  const toggleCourse = (courseId: string) => {
    setHasTouchedCourseAccordion(true);
    setExpandedCourseIds((current) =>
      current.includes(courseId)
        ? current.filter((id) => id !== courseId)
        : [...current, courseId],
    );
  };

  useEffect(() => {
    void dispatch(fetchTracks());
    void dispatch(fetchCoursesByTrack(TRACK_SLUG));
  }, [dispatch]);

  useEffect(() => {
    courses.forEach((course) => {
      void dispatch(fetchCourseModules(course.id));
    });
  }, [courses, dispatch]);

  useEffect(() => {
    moduleIdsKey
      .split(",")
      .filter(Boolean)
      .forEach((module) => {
        void dispatch(fetchModuleLessons(module));
      });
  }, [dispatch, moduleIdsKey]);

  useEffect(() => {
    lessonIdsKey
      .split(",")
      .filter(Boolean)
      .forEach((lessonId) => {
        if (!lessonById[lessonId]) {
          void dispatch(fetchLessonById(lessonId));
        }
      });
  }, [dispatch, lessonById, lessonIdsKey]);

  if (contentError) {
    return (
      <main className={styles.page}>
        <section className={styles.emptyState}>
          <h1>Навчання</h1>
          <p>{contentError}</p>
        </section>
      </main>
    );
  }

  if (courses.length === 0) {
    return (
      <main className={styles.page}>
        <section className={styles.emptyState}>
          <h1>Навчання</h1>
          <p>Завантажуємо твою навчальну програму.</p>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <div>
            <p className={styles.kicker}>Student Area</p>
            <h1>Навчання</h1>
            <p className={styles.lead}>
              {activeTrack?.title ?? "Frontend"}: курси, модулі й уроки в одному
              навчальному маршруті.
            </p>
          </div>

          <div className={styles.heroStats}>
            <span>{courses.length} курсів</span>
            <span>{totalModules} модулів</span>
            <span>
              {completedCount}/{totalLessons || "?"} уроків
            </span>
          </div>
        </section>

        <section className={styles.learningMap}>
          {courseSummaries.map((summary, courseIndex) => {
            const { course, modules, lessons, techChecks, completedCount } = summary;
            const previousCourse = courseSummaries[courseIndex - 1] ?? null;
            const isPreviousCourseCompleted =
              !previousCourse ||
              (previousCourse.lessons.length > 0 &&
                previousCourse.completedCount === previousCourse.lessons.length);
            const isCourseLocked = courseIndex > 0 && !isPreviousCourseCompleted;
            const isExpanded =
              !isCourseLocked &&
              (expandedCourseIds.includes(course.id) ||
                (!hasTouchedCourseAccordion && courseIndex === 0));
            const progressRate =
              lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;
            const coursePanelId = `course-panel-${course.id}`;

            return (
              <article
                key={course.id}
                className={`${styles.courseBlock} ${
                  isCourseLocked ? styles.courseBlockLocked : ""
                }`}
              >
                <div className={styles.courseHeader}>
                  <div>
                    <p className={styles.kicker}>{course.level}</p>
                    <h2>{course.title}</h2>
                    <p className={styles.courseDescription}>{course.description}</p>
                  </div>

                  <div className={styles.courseActions}>
                    <span className={styles.statusBadge}>
                      {isCourseLocked ? "Закрито" : `${progressRate}%`}
                    </span>
                    <button
                      type="button"
                      className={styles.courseAction}
                      aria-controls={coursePanelId}
                      aria-expanded={isExpanded}
                      disabled={isCourseLocked}
                      onClick={() => toggleCourse(course.id)}
                    >
                      {isCourseLocked
                        ? "Пройди попередній курс"
                        : isExpanded
                          ? "Згорнути курс"
                          : "Розгорнути курс"}
                    </button>
                  </div>
                </div>

                <div className={styles.progressTrack} aria-hidden="true">
                  <div
                    className={styles.progressFill}
                    style={{ width: `${progressRate}%` }}
                  />
                </div>

                {isCourseLocked ? (
                  <div className={styles.lockedNotice}>
                    Наступний курс відкриється після завершення попереднього.
                  </div>
                ) : isExpanded ? (
                  <div id={coursePanelId} className={styles.moduleList}>
                    {(() => null)()}
                    {modules.map((module) => {
                      const moduleLessons = lessons.filter(
                        (lesson) => lesson.moduleId === module.id,
                      );
                      const moduleTechCheck =
                        techChecks.find((lesson) => lesson.moduleId === module.id) ??
                        null;
                      const moduleCompletedCount = moduleLessons.filter((lesson) =>
                        completedLessons.includes(lesson.id),
                      ).length;
                      const firstUnfinishedModuleId =
                        modules.find((candidate) => {
                          const candidateLessons = lessons.filter(
                            (lesson) => lesson.moduleId === candidate.id,
                          );
                          const candidateCheck =
                            techChecks.find(
                              (check) => check.moduleId === candidate.id,
                            ) ?? null;
                          return !getModuleState({
                            items: candidateCheck
                              ? [...candidateLessons, candidateCheck]
                              : candidateLessons,
                            completedIds: new Set(completedLessons),
                            nextModuleId: null,
                          }).isModuleComplete;
                        })?.id ?? null;
                      const isModuleOpen =
                        moduleOverrides[module.id] ??
                        module.id === firstUnfinishedModuleId;
                      const modulePanelId = `module-panel-${module.id}`;
                      const moduleCtx = {
                        items: moduleTechCheck
                          ? [...moduleLessons, moduleTechCheck]
                          : moduleLessons,
                        completedIds: new Set(completedLessons),
                        nextModuleId: null,
                      };
                      // Техчек — ворота модуля, а не ще один рядок у списку.
                      const techCheckAccess = moduleTechCheck
                        ? getItemAccess(moduleTechCheck.id, moduleCtx)
                        : null;
                      // Один елемент у модулі — той, з якого продовжувати.
                      const currentItemId = getCurrentItem(moduleCtx)?.id ?? null;

                      return (
                        <section key={module.id} className={styles.moduleBlock}>
                          <button
                            type="button"
                            className={`${styles.moduleHeader} ${
                              isModuleOpen ? styles.moduleHeaderOpen : ""
                            }`}
                            onClick={() => toggleModule(module.id, isModuleOpen)}
                            aria-expanded={isModuleOpen}
                            aria-controls={modulePanelId}
                          >
                            <span className={styles.moduleChevron} aria-hidden="true">
                              ›
                            </span>
                            <span className={styles.moduleHeaderCopy}>
                              <span className={styles.levelLabel}>Модуль</span>
                              <h3>{module.title}</h3>
                              {isModuleOpen && <p>{module.description}</p>}
                            </span>
                            <span className={styles.moduleStat}>
                              {moduleCompletedCount}/{moduleLessons.length || "?"} уроків
                            </span>
                          </button>

                          <div
                            id={modulePanelId}
                            className={styles.lessonList}
                            hidden={!isModuleOpen}
                          >
                            {moduleLessons.length > 0 ? (
                              moduleLessons.map((lesson, index) => {
                                const lessonDetails = lessonById[lesson.id];
                                const lessonTasks = lessonDetails?.tasks ?? [];
                                const completedTaskCount = countCompletedTasks(
                                  lessonTasks,
                                  taskStatus[lesson.id],
                                );
                                const isCompleted = completedLessons.includes(lesson.id);
                                const isLessonUnlocked =
                                  getItemAccess(lesson.id, moduleCtx).unlocked;
                                const rowState = isCompleted
                                  ? "done"
                                  : lesson.id === currentItemId
                                    ? "current"
                                    : isLessonUnlocked
                                      ? "open"
                                      : "locked";
                                const rowLabel = {
                                  done: "Завершено",
                                  current: "Продовжити",
                                  open: "Відкрити",
                                  locked: "Недоступно",
                                }[rowState];
                                const hasVideo = Boolean(lessonDetails?.videos.length);
                                const isVideoWatched =
                                  isCompleted || Boolean(videoStatus[lesson.id]);
                                const lessonRowContent = (
                                  <>
                                    <span
                                      className={`${styles.lessonIndex} ${
                                        styles[`index_${rowState}`]
                                      }`}
                                    >
                                      {isCompleted ? "✓" : index + 1}
                                    </span>
                                    <div className={styles.lessonCopy}>
                                      <h4>{lesson.title}</h4>
                                      <p>{lesson.description}</p>
                                      <div className={styles.lessonSteps}>
                                        {hasVideo && (
                                          <span
                                            className={
                                              isVideoWatched
                                                ? styles.lessonStepDone
                                                : styles.lessonStepTodo
                                            }
                                          >
                                            {isVideoWatched ? "✓ Відео" : "Відео"}
                                          </span>
                                        )}
                                        <span
                                          className={
                                            isCompleted
                                              ? styles.lessonStepDone
                                              : styles.lessonStepTodo
                                          }
                                        >
                                          Практика
                                        </span>
                                      </div>
                                    </div>
                                    <div className={styles.lessonMeta}>
                                      <span>
                                        {completedTaskCount}/{lessonTasks.length || "?"} задач
                                      </span>
                                      <strong className={styles[`label_${rowState}`]}>
                                        {rowLabel}
                                      </strong>
                                    </div>
                                  </>
                                );

                                return isLessonUnlocked ? (
                                  <Link
                                    key={lesson.id}
                                    className={`${styles.lessonRow} ${
                                      styles[`row_${rowState}`]
                                    }`}
                                    to={buildStudentLessonPath(
                                      lesson.courseId,
                                      lesson.moduleId,
                                      lesson.id,
                                    )}
                                  >
                                    {lessonRowContent}
                                  </Link>
                                ) : (
                                  <div
                                    key={lesson.id}
                                    className={`${styles.lessonRow} ${styles.row_locked}`}
                                  >
                                    {lessonRowContent}
                                  </div>
                                );
                              })
                            ) : (
                              <div className={styles.lessonPlaceholder}>
                                У цьому модулі поки немає уроків.
                              </div>
                            )}
                          </div>

                          {isModuleOpen &&
                            moduleTechCheck &&
                            (() => {
                              const isLocked = techCheckAccess?.unlocked === false;
                              const remaining =
                                techCheckAccess?.unlocked === false
                                  ? techCheckAccess.remaining
                                  : 0;

                              const techCheckBody = (
                                <>
                                  <div className={styles.techCheckCopy}>
                                    <p className={styles.levelLabel}>Техчек</p>
                                    <h4>{moduleTechCheck.title}</h4>
                                    <p>
                                      {isLocked
                                        ? `Відкриється, коли пройдеш усі уроки модуля. Лишилось: ${remaining}.`
                                        : moduleTechCheck.description}
                                    </p>
                                  </div>
                                  <strong>
                                    {completedLessons.includes(moduleTechCheck.id)
                                      ? "Завершено"
                                      : isLocked
                                        ? "Недоступно"
                                        : "Пройти"}
                                  </strong>
                                </>
                              );

                              return isLocked ? (
                                <div
                                  className={`${styles.techCheckRow} ${styles.techCheckRowLocked}`}
                                >
                                  {techCheckBody}
                                </div>
                              ) : (
                                <Link
                                  className={styles.techCheckRow}
                                  to={buildStudentTechCheckPath(
                                    moduleTechCheck.courseId,
                                    moduleTechCheck.moduleId,
                                    moduleTechCheck.id,
                                  )}
                                >
                                  {techCheckBody}
                                </Link>
                              );
                            })()}
                        </section>
                      );
                    })}
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
};

export default StudentLearningPage;
