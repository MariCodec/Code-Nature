import { FaCheckCircle, FaHourglassHalf } from "react-icons/fa"; // Іконки
import styles from "./HtmlLessons.module.scss";
import { useDispatch, useSelector } from "react-redux";
import { markLessonAsCompleted } from "../../store/slices/progressSlice";
import { htmlLessons } from "../../data/lessonData";
import { RootState } from "../../store";

const HtmlLessons = () => {
  const dispatch = useDispatch();
  const completedLessons = useSelector(
    (state: RootState) => state.progress.completedLessons
  );

  const handleCompleteLesson = (lessonId: string) => {
    dispatch(markLessonAsCompleted(lessonId));
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>HTML Уроки</h2>
      <div className={styles.lessonCardContainer}>
        {htmlLessons.map((lesson) => (
          <div
            key={lesson.id}
            className={`${styles.lessonCard} ${
              completedLessons.includes(lesson.id) ? styles.completedCard : ""
            }`}
          >
            <div>
              <h3 className={styles.lessonCardTitle}>{lesson.title}</h3>
              <p>{lesson.description}</p>
            </div>
            <div>
              <button
                className={styles.lessonCardButton}
                onClick={() => handleCompleteLesson(lesson.id)}
                disabled={completedLessons.includes(lesson.id)}
              >
                Завершити урок
              </button>
              {completedLessons.includes(lesson.id) ? (
                <span className={`${styles.completedText} ${styles.icon}`}>
                  <FaCheckCircle /> Завершено
                </span>
              ) : (
                <span className={`${styles.icon}`}>
                  <FaHourglassHalf /> В процесі
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HtmlLessons;
