import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./LessonNavigation.module.scss";
import { AppDispatch, RootState } from "../../store";
// import { markLessonAsCompleted } from "../../store/slices/progressSlice";
import { LessonCategory } from "../../types/lessonTypes";
import {
  fetchCourseLessons,
  fetchCoursesByTrack,
  selectCourseLessons,
  selectCoursesByTrack,
} from "../../store/slices/contentSlice";
import { findCourseByLegacyCategory } from "../../utils/courseMapping";

const LessonNavigation: React.FC<{ currentLessonId: string }> = ({
  currentLessonId,
}) => {
  // const dispatch = useDispatch();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { category } = useParams<{ category: LessonCategory }>();
  const completedLessons = useSelector(
    (state: RootState) => state.progress.completedLessons,
  );
  const frontendCourses = useSelector((state: RootState) =>
    selectCoursesByTrack(state, "frontend"),
  );
  const selectedCourse = category
    ? findCourseByLegacyCategory(frontendCourses, category)
    : null;
  const categoryLessons = useSelector((state: RootState) =>
    selectedCourse ? selectCourseLessons(state, selectedCourse.id) : [],
  );

  useEffect(() => {
    void dispatch(fetchCoursesByTrack("frontend"));
  }, [dispatch]);

  useEffect(() => {
    if (!selectedCourse) return;
    void dispatch(fetchCourseLessons(selectedCourse.id));
  }, [dispatch, selectedCourse]);

  if (!category) {
    return <h2>Категорія не знайдена</h2>;
  }

  // Знаходимо індекс поточного уроку
  const currentIndex = categoryLessons.findIndex(
    (lesson) => lesson.id === currentLessonId,
  );

  // Наступний і попередній уроки
  const prevLesson =
    currentIndex > 0 ? categoryLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < categoryLessons.length - 1
      ? categoryLessons[currentIndex + 1]
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
          prevLesson && navigate(`/student/${category}/${prevLesson.id}`)
        }
        disabled={!prevLesson}
        className={styles.navButton}
      >
        Попередній урок
      </button>

      <button
        onClick={() =>
          nextLesson && navigate(`/student/${category}/${nextLesson.id}`)
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
