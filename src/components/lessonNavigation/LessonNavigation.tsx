import React from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./LessonNavigation.module.scss";
import { lessons } from "../../data/lessonData";
import { RootState } from "../../store";
// import { markLessonAsCompleted } from "../../store/slices/progressSlice";
import { LessonCategory } from "../../types/lessonTypes";

const LessonNavigation: React.FC<{ currentLessonId: string }> = ({
  currentLessonId,
}) => {
  // const dispatch = useDispatch();
  const navigate = useNavigate();
  const { category } = useParams<{ category: string }>(); // Отримуємо категорію з URL
  const completedLessons = useSelector(
    (state: RootState) => state.progress.completedLessons
  );


if (!category || !lessons[category as LessonCategory]) {
  return <h2>Категорія не знайдена</h2>;
}

  // Отримуємо список уроків для поточної категорії (html або css)
  const categoryLessons = lessons[category as LessonCategory];

  // Знаходимо індекс поточного уроку
  const currentIndex = categoryLessons.findIndex(
    (lesson) => lesson.id === currentLessonId
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
        onClick={() => prevLesson && navigate(`/${category}/${prevLesson.id}`)}
        disabled={!prevLesson}
        className={styles.navButton}
      >
        Попередній урок
      </button>

      <button
        onClick={() => nextLesson && navigate(`/${category}/${nextLesson.id}`)}
        disabled={!nextLesson || !completedLessons.includes(currentLessonId)}
        className={styles.navButton}
      >
        Наступний урок
      </button>
    </div>
  );
};

export default LessonNavigation;
