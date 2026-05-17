import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import styles from "./StudentTechChecksPage.module.scss";
import type { AppDispatch, RootState } from "../../store";
import {
  fetchCourseModules,
  fetchCoursesByTrack,
  fetchLessonById,
  fetchModuleLessons,
  selectContentError,
  selectCourseLessons,
  selectCourseModules,
  selectCoursesByTrack,
} from "../../store/slices/contentSlice";
import { buildStudentTechCheckPath } from "../../utils/courseMapping";

const TRACK_SLUG = "frontend";

const StudentTechChecksPage = () => {
  const dispatch = useDispatch<AppDispatch>();
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
      const items = selectCourseLessons(state, course.id);
      const techChecks = items.filter((item) => item.lessonKind === "tech_check");

      return {
        course,
        modules,
        techChecks,
      };
    }),
  );
  const moduleIdsKey = courseSummaries
    .flatMap((item) => item.modules)
    .map((module) => module.id)
    .join(",");
  const techCheckIdsKey = courseSummaries
    .flatMap((item) => item.techChecks)
    .map((techCheck) => techCheck.id)
    .join(",");
  const techChecksCount = courseSummaries.reduce(
    (sum, item) => sum + item.techChecks.length,
    0,
  );
  const completedTechChecksCount = courseSummaries.reduce(
    (sum, item) =>
      sum +
      item.techChecks.filter((techCheck) => completedLessons.includes(techCheck.id))
        .length,
    0,
  );

  useEffect(() => {
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
      .forEach((moduleId) => {
        void dispatch(fetchModuleLessons(moduleId));
      });
  }, [dispatch, moduleIdsKey]);

  useEffect(() => {
    techCheckIdsKey
      .split(",")
      .filter(Boolean)
      .forEach((lessonId) => {
        if (!lessonById[lessonId]) {
          void dispatch(fetchLessonById(lessonId));
        }
      });
  }, [dispatch, lessonById, techCheckIdsKey]);

  if (contentError) {
    return (
      <main className={styles.page}>
        <section className={styles.emptyState}>
          <h1>Техчеки</h1>
          <p>{contentError}</p>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <div>
            <p className={styles.kicker}>Контрольні перевірки</p>
            <h1>Техчеки</h1>
            <p>
              Один техчек закриває один модуль. Спочатку проходиш уроки модуля,
              потім перевіряєш, чи можеш зібрати рішення самостійно.
            </p>
          </div>
          <div className={styles.heroStats}>
            <span>
              {completedTechChecksCount}/{techChecksCount || "?"} завершено
            </span>
          </div>
        </section>

        <section className={styles.checkList}>
          {courseSummaries.map(({ course, modules, techChecks }) => (
            <article key={course.id} className={styles.courseBlock}>
              <div className={styles.courseHeader}>
                <p className={styles.kicker}>Курс</p>
                <h2>{course.title}</h2>
              </div>

              {modules.map((module) => {
                const techCheck =
                  techChecks.find((item) => item.moduleId === module.id) ?? null;

                if (!techCheck) return null;

                const details = lessonById[techCheck.id];
                const completedTaskCount = Object.values(
                  taskStatus[techCheck.id] ?? {},
                ).filter(Boolean).length;
                const taskCount = details?.tasks.length ?? 0;
                const isCompleted = completedLessons.includes(techCheck.id);

                return (
                  <Link
                    key={techCheck.id}
                    className={styles.checkRow}
                    to={buildStudentTechCheckPath(
                      techCheck.courseId,
                      techCheck.moduleId,
                      techCheck.id,
                    )}
                  >
                    <div>
                      <p className={styles.kicker}>Модуль</p>
                      <h3>{module.title}</h3>
                      <p>{techCheck.description}</p>
                    </div>
                    <div className={styles.checkMeta}>
                      <span>
                        {completedTaskCount}/{taskCount || "?"} задач
                      </span>
                      <strong>{isCompleted ? "Завершено" : "Пройти"}</strong>
                    </div>
                  </Link>
                );
              })}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
};

export default StudentTechChecksPage;
