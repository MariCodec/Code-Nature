import { FaCheckCircle, FaHourglassHalf } from "react-icons/fa";
import { useEffect } from "react";
import styles from "./LessonsList.module.scss";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  fetchCourseModules,
  fetchCoursesByTrack,
  fetchModuleLessons,
  selectContentError,
  selectCourseLessons,
  selectCourseLessonsStatus,
  selectCourseModules,
  selectCourseModulesStatus,
  selectCoursesByTrack,
} from "../../store/slices/contentSlice";
import {
  buildStudentLessonPath,
  buildStudentTechCheckPath,
} from "../../utils/courseMapping";

const LessonsList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId?: string }>();

  const completedLessons = useSelector(
    (state: RootState) => state.progress.completedLessons,
  );
  const contentError = useSelector(selectContentError);
  const frontendCourses = useSelector((state: RootState) =>
    selectCoursesByTrack(state, "frontend"),
  );
  const selectedCourse = courseId
    ? frontendCourses.find((course) => course.id === courseId) ?? null
    : null;
  const categoryLessons = useSelector((state: RootState) =>
    selectedCourse ? selectCourseLessons(state, selectedCourse.id) : [],
  );
  const regularLessons = categoryLessons.filter(
    (lesson) => lesson.lessonKind === "lesson",
  );
  const techChecks = categoryLessons.filter(
    (lesson) => lesson.lessonKind === "tech_check",
  );
  const courseModules = useSelector((state: RootState) =>
    selectedCourse ? selectCourseModules(state, selectedCourse.id) : [],
  );
  const modulesStatus = useSelector((state: RootState) =>
    selectedCourse ? selectCourseModulesStatus(state, selectedCourse.id) : "idle",
  );
  const lessonsStatus = useSelector((state: RootState) =>
    selectedCourse ? selectCourseLessonsStatus(state, selectedCourse.id) : "idle",
  );

  useEffect(() => {
    void dispatch(fetchCoursesByTrack("frontend"));
  }, [dispatch]);

  useEffect(() => {
    if (!selectedCourse) return;
    void dispatch(fetchCourseModules(selectedCourse.id));
  }, [dispatch, selectedCourse]);

  useEffect(() => {
    courseModules.forEach((module) => {
      void dispatch(fetchModuleLessons(module.id));
    });
  }, [courseModules, dispatch]);

  if (!courseId) {
    return <h2>Курс не знайдено</h2>;
  }

  if (contentError) {
    return <h2>{contentError}</h2>;
  }

  if (
    selectedCourse &&
    (modulesStatus === "loading" || lessonsStatus === "loading") &&
    categoryLessons.length === 0
  ) {
    return <h2>Завантаження уроків...</h2>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <div>
            <p className={styles.kicker}>Student Area</p>
            <h2 className={styles.heading}>
              {selectedCourse?.title ?? "Уроки курсу"}
            </h2>
          </div>

          <Link className={styles.backLink} to="/student/learning">
            Навчання
          </Link>

          <button
            type="button"
            className={styles.progressButton}
            onClick={() => navigate("/student/progress")}
          >
            Мій прогрес
          </button>
        </div>

        {courseModules.map((module) => {
          const moduleLessons = regularLessons.filter(
            (lesson) => lesson.moduleId === module.id,
          );
          const moduleTechCheck =
            techChecks.find((lesson) => lesson.moduleId === module.id) ?? null;

          return (
            <section key={module.id} className={styles.moduleSection}>
              <div className={styles.moduleHeader}>
                <h3>{module.title}</h3>
                <p>{module.description}</p>
              </div>

              <div className={styles.lessonCardContainer}>
                {moduleLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className={`${styles.lessonCard} ${
                      completedLessons.includes(lesson.id) ? styles.completedCard : ""
                    }`}
                    onClick={() =>
                      navigate(
                        buildStudentLessonPath(
                          lesson.courseId,
                          lesson.moduleId,
                          lesson.id,
                        ),
                      )
                    }
                  >
                    <div>
                      <h3 className={styles.lessonCardTitle}>{lesson.title}</h3>
                      <p>{lesson.description}</p>
                    </div>

                    <div>
                      {completedLessons.includes(lesson.id) ? (
                        <span className={`${styles.completedText} ${styles.icon}`}>
                          <FaCheckCircle /> Завершено
                        </span>
                      ) : (
                        <span className={styles.icon}>
                          <FaHourglassHalf /> В процесі
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {moduleTechCheck && (
                <div
                  className={`${styles.lessonCard} ${styles.techCheckCard} ${
                    completedLessons.includes(moduleTechCheck.id)
                      ? styles.completedCard
                      : ""
                  }`}
                  onClick={() =>
                    navigate(
                      buildStudentTechCheckPath(
                        moduleTechCheck.courseId,
                        moduleTechCheck.moduleId,
                        moduleTechCheck.id,
                      ),
                    )
                  }
                >
                  <div>
                    <span className={styles.techCheckLabel}>Техчек модуля</span>
                    <h3 className={styles.lessonCardTitle}>{moduleTechCheck.title}</h3>
                    <p>{moduleTechCheck.description}</p>
                  </div>

                  <div>
                    {completedLessons.includes(moduleTechCheck.id) ? (
                      <span className={`${styles.completedText} ${styles.icon}`}>
                        <FaCheckCircle /> Завершено
                      </span>
                    ) : (
                      <span className={styles.icon}>
                        <FaHourglassHalf /> Контрольна перевірка
                      </span>
                    )}
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default LessonsList;
