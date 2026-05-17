import { useEffect } from "react";
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

const TRACK_SLUG = "frontend";

const StudentLearningPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const tracks = useSelector(selectTracks);
  const courses = useSelector((state: RootState) =>
    selectCoursesByTrack(state, TRACK_SLUG),
  );
  const completedLessons = useSelector(
    (state: RootState) => state.progress.completedLessons,
  );
  const taskStatus = useSelector((state: RootState) => state.progress.taskStatus);
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
          {courseSummaries.map(({ course, modules, lessons, techChecks, completedCount }) => {
            const progressRate =
              lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

            return (
              <article key={course.id} className={styles.courseBlock}>
                <div className={styles.courseHeader}>
                  <div>
                    <p className={styles.kicker}>{course.level}</p>
                    <h2>{course.title}</h2>
                    <p className={styles.courseDescription}>{course.description}</p>
                  </div>

                  <div className={styles.courseActions}>
                    <span className={styles.statusBadge}>{progressRate}%</span>
                    <Link
                      className={styles.courseAction}
                      to={`/student/courses/${course.id}`}
                    >
                      Відкрити курс
                    </Link>
                  </div>
                </div>

                <div className={styles.progressTrack} aria-hidden="true">
                  <div
                    className={styles.progressFill}
                    style={{ width: `${progressRate}%` }}
                  />
                </div>

                <div className={styles.moduleList}>
                  {modules.map((module) => {
                    const moduleLessons = lessons.filter(
                      (lesson) => lesson.moduleId === module.id,
                    );
                    const moduleTechCheck =
                      techChecks.find((lesson) => lesson.moduleId === module.id) ?? null;
                    const moduleCompletedCount = moduleLessons.filter((lesson) =>
                      completedLessons.includes(lesson.id),
                    ).length;

                    return (
                      <section key={module.id} className={styles.moduleBlock}>
                        <div className={styles.moduleHeader}>
                          <div>
                            <p className={styles.levelLabel}>Модуль</p>
                            <h3>{module.title}</h3>
                            <p>{module.description}</p>
                          </div>
                          <span>
                            {moduleCompletedCount}/{moduleLessons.length || "?"} уроків
                          </span>
                        </div>

                        <div className={styles.lessonList}>
                          {moduleLessons.length > 0 ? (
                            moduleLessons.map((lesson, index) => {
                              const lessonTasks = lessonById[lesson.id]?.tasks ?? [];
                              const completedTaskCount = Object.values(
                                taskStatus[lesson.id] ?? {},
                              ).filter(Boolean).length;
                              const isCompleted = completedLessons.includes(lesson.id);

                              return (
                                <Link
                                  key={lesson.id}
                                  className={styles.lessonRow}
                                  to={buildStudentLessonPath(
                                    lesson.courseId,
                                    lesson.moduleId,
                                    lesson.id,
                                  )}
                                >
                                  <span className={styles.lessonIndex}>
                                    {index + 1}
                                  </span>
                                  <div className={styles.lessonCopy}>
                                    <p className={styles.levelLabel}>Урок</p>
                                    <h4>{lesson.title}</h4>
                                    <p>{lesson.description}</p>
                                  </div>
                                  <div className={styles.lessonMeta}>
                                    <span>
                                      {completedTaskCount}/{lessonTasks.length || "?"} задач
                                    </span>
                                    <strong>
                                      {isCompleted ? "Завершено" : "В процесі"}
                                    </strong>
                                  </div>
                                </Link>
                              );
                            })
                          ) : (
                            <div className={styles.lessonPlaceholder}>
                              Уроки модуля завантажуються.
                            </div>
                          )}
                        </div>

                        {moduleTechCheck && (
                          <Link
                            className={styles.techCheckRow}
                            to={buildStudentTechCheckPath(
                              moduleTechCheck.courseId,
                              moduleTechCheck.moduleId,
                              moduleTechCheck.id,
                            )}
                          >
                            <div className={styles.techCheckCopy}>
                              <p className={styles.levelLabel}>Техчек</p>
                              <h4>{moduleTechCheck.title}</h4>
                              <p>{moduleTechCheck.description}</p>
                            </div>
                            <strong>
                              {completedLessons.includes(moduleTechCheck.id)
                                ? "Завершено"
                                : "Пройти"}
                            </strong>
                          </Link>
                        )}
                      </section>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
};

export default StudentLearningPage;
