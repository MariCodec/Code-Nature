import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import styles from "./StudentProgressPage.module.scss";
import type { AppDispatch, RootState } from "../../store";
import { selectAuthUser } from "../../store/slices/authSlice";
import { countCompletedTasks } from "../../domain/progression";
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
import {
  buildStudentLessonPath,
  findLegacyCategoryByCourseId,
} from "../../utils/courseMapping";

const getPluralForm = (
  count: number,
  [one, few, many]: [string, string, string],
) => {
  const remainder10 = count % 10;
  const remainder100 = count % 100;

  if (remainder10 === 1 && remainder100 !== 11) return one;
  if (remainder10 >= 2 && remainder10 <= 4 && (remainder100 < 12 || remainder100 > 14)) {
    return few;
  }

  return many;
};

const getBlockLabel = (category: string | null) => {
  if (category === "html") return "HTML";
  if (category === "css") return "CSS";
  if (category === "js") return "JS";
  return "Frontend";
};

const StudentProgressPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectAuthUser);
  const progress = useSelector((state: RootState) => state.progress);
  const frontendCourses = useSelector((state: RootState) =>
    selectCoursesByTrack(state, "frontend"),
  );
  const frontendModuleIdsKey = useSelector((state: RootState) =>
    frontendCourses
      .flatMap((course) => selectCourseModules(state, course.id))
      .map((module) => module.id)
      .join(","),
  );
  const contentError = useSelector(selectContentError);
  const allLessons = useSelector((state: RootState) =>
    frontendCourses.flatMap((course) =>
      [...selectCourseLessons(state, course.id)]
        .filter((lesson) => lesson.lessonKind === "lesson")
        .sort((a, b) => a.orderIndex - b.orderIndex),
    ),
  );
  const lessonById = useSelector((state: RootState) => state.content.lessonById);

  const frontendCourseIdsKey = frontendCourses.map((course) => course.id).join(",");
  const missingLessonIdsKey = allLessons
    .filter((lesson) => !lessonById[lesson.id])
    .map((lesson) => lesson.id)
    .join(",");

  useEffect(() => {
    void dispatch(fetchCoursesByTrack("frontend"));
  }, [dispatch]);

  useEffect(() => {
    frontendCourseIdsKey
      .split(",")
      .filter(Boolean)
      .forEach((courseId) => {
        void dispatch(fetchCourseModules(courseId));
      });
  }, [dispatch, frontendCourseIdsKey]);

  useEffect(() => {
    frontendModuleIdsKey
      .split(",")
      .filter(Boolean)
      .forEach((module) => {
        void dispatch(fetchModuleLessons(module));
      });
  }, [dispatch, frontendModuleIdsKey]);

  useEffect(() => {
    missingLessonIdsKey
      .split(",")
      .filter(Boolean)
      .forEach((lessonId) => {
        void dispatch(fetchLessonById(lessonId));
      });
  }, [dispatch, missingLessonIdsKey]);

  if (!user) {
    return null;
  }

  if (contentError) {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <section className={styles.emptyState}>
            <h1>Мій прогрес</h1>
            <p>{contentError}</p>
          </section>
        </div>
      </div>
    );
  }

  if (frontendCourses.length === 0 || allLessons.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <section className={styles.emptyState}>
            <h1>Мій прогрес</h1>
            <p>Завантажуємо уроки та зводимо твій прогрес.</p>
          </section>
        </div>
      </div>
    );
  }

  const completedLessonIds = new Set(progress.completedLessons);
  const completedLessons = allLessons.filter((lesson) => completedLessonIds.has(lesson.id));
  const lastCompletedLesson = completedLessons[completedLessons.length - 1] ?? null;
  const firstIncompleteLesson =
    allLessons.find((lesson) => !completedLessonIds.has(lesson.id)) ?? null;
  const currentLesson =
    allLessons.find((lesson) => lesson.id === progress.currentLessonId) ??
    firstIncompleteLesson;
  const continueLesson =
    firstIncompleteLesson ??
    (currentLesson && !completedLessonIds.has(currentLesson.id)
      ? currentLesson
      : null) ??
    lastCompletedLesson ??
    allLessons[0] ??
    null;
  const continueCategory = continueLesson
    ? findLegacyCategoryByCourseId(continueLesson.courseId)
    : null;
  const continueHref = continueLesson
    ? buildStudentLessonPath(
        continueLesson.courseId,
        continueLesson.moduleId,
        continueLesson.id,
      )
    : null;
  const activeCourse =
    frontendCourses.find((course) => course.id === continueLesson?.courseId) ??
    frontendCourses.find((course) => course.id === currentLesson?.courseId) ??
    frontendCourses[0] ??
    null;
  const activeCourseLessons = activeCourse
    ? allLessons.filter((lesson) => lesson.courseId === activeCourse.id)
    : [];

  const totalTasks = allLessons.reduce(
    (sum, lesson) => sum + (lessonById[lesson.id]?.tasks.length ?? 0),
    0,
  );
  // Рахуємо від завдань завантажених уроків, а не від усіх ключів сховища —
  // саме звідси бралося «9/3»: чисельник повний, знаменник частковий.
  const completedTasks = allLessons.reduce(
    (sum, lesson) =>
      sum +
      countCompletedTasks(
        lessonById[lesson.id]?.tasks ?? [],
        progress.taskStatus[lesson.id],
      ),
    0,
  );
  const remainingLessons = Math.max(allLessons.length - completedLessons.length, 0);
  const remainingTasks = Math.max(totalTasks - completedTasks, 0);
  const continueLessonTaskTotal = continueLesson
    ? lessonById[continueLesson.id]?.tasks.length ?? 0
    : 0;
  const continueLessonTaskCompleted = continueLesson
    ? countCompletedTasks(
        lessonById[continueLesson.id]?.tasks ?? [],
        progress.taskStatus[continueLesson.id],
      )
    : 0;
  const activeCourseCompletedLessons = activeCourseLessons.filter((lesson) =>
    completedLessonIds.has(lesson.id),
  ).length;
  const activeCourseTaskTotal = activeCourseLessons.reduce(
    (sum, lesson) => sum + (lessonById[lesson.id]?.tasks.length ?? 0),
    0,
  );
  const activeCourseTaskCompleted = activeCourseLessons.reduce(
    (sum, lesson) =>
      sum +
      countCompletedTasks(
        lessonById[lesson.id]?.tasks ?? [],
        progress.taskStatus[lesson.id],
      ),
    0,
  );
  const activeCourseProgressRate =
    activeCourseTaskTotal > 0
      ? Math.round((activeCourseTaskCompleted / activeCourseTaskTotal) * 100)
      : 0;
  const hasFinishedEverything =
    allLessons.length > 0 && completedLessons.length === allLessons.length;
  const courseStatusLabel = hasFinishedEverything
    ? "Курс завершено"
    : `${remainingLessons} ${getPluralForm(remainingLessons, ["урок", "уроки", "уроків"])} залишилось`;
  const blockLabel = getBlockLabel(continueCategory);
  const activeLessonLabel = hasFinishedEverything ? "Останній урок" : "Активний урок";
  const activeLessonTitle = continueLesson?.title ?? "Урок ще не вибрано";
  const activeLessonDescription = continueLesson?.description ?? "Відкрий урок, щоб продовжити навчання.";
  const activeLessonActionLabel = hasFinishedEverything ? "Повторити урок" : "Перейти до уроку";

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.pageHeader}>
          <p className={styles.eyebrow}>Кабінет учня</p>
          <h1>Мій прогрес</h1>
          <p className={styles.heroText}>
            Тут видно поточний курс, активний урок і вже завершені теми.
          </p>
        </header>

        <section className={styles.overviewGrid}>
          <article className={styles.courseCard}>
            <div className={styles.courseCardHeader}>
              <div>
                <p className={styles.sectionLabel}>Поточний курс</p>
                <h2>{activeCourse?.title ?? "Frontend курс"}</h2>
              </div>
              <span className={styles.blockBadge}>{blockLabel}</span>
            </div>

            <p className={styles.courseDescription}>
              {activeCourse?.description ??
                "Поступово проходь уроки, закривай задачі й переходь до наступної теми."}
            </p>

            <div className={styles.progressMeta}>
              <span>{activeCourseProgressRate}% виконано</span>
              <span>{courseStatusLabel}</span>
            </div>

            <div className={styles.progressBarTrack} aria-hidden="true">
              <div
                className={styles.progressBarFill}
                style={{ width: `${activeCourseProgressRate}%` }}
              />
            </div>

            <div className={styles.statsGrid}>
              <article className={styles.statCard}>
                <p className={styles.sectionLabel}>Уроки</p>
                <strong>
                  {activeCourseCompletedLessons}/{activeCourseLessons.length || "?"}
                </strong>
                <span>завершено у курсі</span>
              </article>

              <article className={styles.statCard}>
                <p className={styles.sectionLabel}>Задачі</p>
                <strong>
                  {activeCourseTaskCompleted}/{activeCourseTaskTotal || "?"}
                </strong>
                <span>виконано у курсі</span>
              </article>

              <article className={styles.statCard}>
                <p className={styles.sectionLabel}>Загалом</p>
                <strong>{completedTasks}/{totalTasks || "?"}</strong>
                <span>
                  {remainingTasks > 0
                    ? `${remainingTasks} ${getPluralForm(remainingTasks, ["задача", "задачі", "задач"])} попереду`
                    : "Усі задачі виконано"}
                </span>
              </article>
            </div>
          </article>

          <aside className={styles.activeLessonCard}>
            <p className={styles.sectionLabel}>{activeLessonLabel}</p>
            {continueLesson && continueHref ? (
              <>
                <h2>{activeLessonTitle}</h2>
                <p>{activeLessonDescription}</p>

                <div className={styles.lessonMeta}>
                  <span>
                    {continueLessonTaskCompleted}/{continueLessonTaskTotal || "?"} задач у вибраному
                    уроці
                  </span>
                  <span>
                    {completedLessonIds.has(continueLesson.id)
                      ? "Урок завершено"
                      : "Урок в процесі"}
                  </span>
                </div>

                <Link className={styles.primaryAction} to={continueHref}>
                  {activeLessonActionLabel}
                </Link>
              </>
            ) : (
              <>
                <h2>Уроки скоро з'являться</h2>
                <p>Щойно контент буде доступний, цей блок підкаже, з чого продовжити.</p>
              </>
            )}
          </aside>
        </section>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.sectionLabel}>Завершені уроки</p>
              <h2>Що ти вже пройшов(ла)</h2>
            </div>
            <span className={styles.badge}>{completedLessons.length}</span>
          </div>

          {completedLessons.length > 0 ? (
            <div className={styles.lessonList}>
              {completedLessons.map((lesson) => {
                const href = buildStudentLessonPath(
                  lesson.courseId,
                  lesson.moduleId,
                  lesson.id,
                );

                return (
                  <article key={lesson.id} className={styles.lessonRow}>
                    <div>
                      <h3>{lesson.title}</h3>
                      <p>{lesson.description}</p>
                    </div>

                    <Link className={styles.secondaryAction} to={href}>
                      Відкрити
                    </Link>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={styles.placeholderBlock}>
              <h3>Ще немає завершених уроків</h3>
              <p>
                Почни з першого уроку. Щойно ти закриєш усі задачі, завершені уроки
                автоматично з'являться тут.
              </p>
            </div>
          )}
        </article>
      </div>
    </div>
  );
};

export default StudentProgressPage;
