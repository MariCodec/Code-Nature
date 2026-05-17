import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./LessonNavigation.module.scss";
import { AppDispatch, RootState } from "../../store";
// import { markLessonAsCompleted } from "../../store/slices/progressSlice";
import {
  fetchCourseModules,
  fetchCoursesByTrack,
  fetchModuleLessons,
  selectCourseLessons,
  selectCourseModules,
  selectCoursesByTrack,
} from "../../store/slices/contentSlice";
import {
  buildStudentLessonPath,
  buildStudentTechCheckPath,
} from "../../utils/courseMapping";

const LessonNavigation: React.FC<{ currentLessonId: string }> = ({
  currentLessonId,
}) => {
  // const dispatch = useDispatch();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { courseId, moduleId } = useParams<{ courseId?: string; moduleId?: string }>();
  const completedLessons = useSelector(
    (state: RootState) => state.progress.completedLessons,
  );
  const frontendCourses = useSelector((state: RootState) =>
    selectCoursesByTrack(state, "frontend"),
  );
  const selectedCourse = courseId
    ? frontendCourses.find((course) => course.id === courseId) ?? null
    : null;
  const courseModules = useSelector((state: RootState) =>
    selectedCourse ? selectCourseModules(state, selectedCourse.id) : [],
  );
  const categoryLessons = useSelector((state: RootState) =>
    selectedCourse ? selectCourseLessons(state, selectedCourse.id) : [],
  );
  const orderedModuleItems = categoryLessons.filter(
    (lesson) => lesson.moduleId === moduleId,
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

  if (!courseId || !moduleId) {
    return <h2>Урок не знайдено</h2>;
  }

  // Знаходимо індекс поточного уроку
  const currentIndex = orderedModuleItems.findIndex(
    (lesson) => lesson.id === currentLessonId,
  );

  // Наступний і попередній уроки
  const prevLesson =
    currentIndex > 0 ? orderedModuleItems[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < orderedModuleItems.length - 1
      ? orderedModuleItems[currentIndex + 1]
      : null;

  // Завершити урок
  // const handleCompleteLesson = () => {
  //   if (!completedLessons.includes(currentLessonId)) {
  //     dispatch(markLessonAsCompleted(currentLessonId));
  //   }
  // };

  return (
    <div className={styles.navigationContainer}>
      <button
        onClick={() =>
          prevLesson &&
          navigate(
            prevLesson.lessonKind === "tech_check"
              ? buildStudentTechCheckPath(
                  prevLesson.courseId,
                  prevLesson.moduleId,
                  prevLesson.id,
                )
              : buildStudentLessonPath(
                  prevLesson.courseId,
                  prevLesson.moduleId,
                  prevLesson.id,
                ),
          )
        }
        disabled={!prevLesson}
        className={styles.navButton}
      >
        Попередній урок
      </button>

      <button
        onClick={() =>
          nextLesson &&
          navigate(
            nextLesson.lessonKind === "tech_check"
              ? buildStudentTechCheckPath(
                  nextLesson.courseId,
                  nextLesson.moduleId,
                  nextLesson.id,
                )
              : buildStudentLessonPath(
                  nextLesson.courseId,
                  nextLesson.moduleId,
                  nextLesson.id,
                ),
          )
        }
        disabled={!nextLesson || !completedLessons.includes(currentLessonId)}
        className={styles.navButton}
      >
        Наступний урок
      </button>
    </div>
  );
};

export default LessonNavigation;
