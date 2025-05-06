import { FaCheckCircle, FaHourglassHalf } from "react-icons/fa"; // Іконки
import styles from "./LessonsList.module.scss";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { lessons } from "../../data/lessonData";
import { useNavigate, useParams } from "react-router-dom";
import { Lessons } from "../../types/lessonTypes";

const LessonsList = () => {
  const navigate = useNavigate();
  const { category } = useParams<{ category: string }>(); // Отримуємо категорію (html або css) з URL
  const completedLessons = useSelector(
    (state: RootState) => state.progress.completedLessons
  );

  if (!category || !lessons[category as keyof Lessons]) {
    return <h2>Категорія не знайдена</h2>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>{category.toUpperCase()} Уроки</h2>
      <div className={styles.lessonCardContainer}>
        {lessons[category as keyof Lessons].map((lesson) => (
          <div
            key={lesson.id}
            className={`${styles.lessonCard} ${
              completedLessons.includes(lesson.id) ? styles.completedCard : ""
            }`}
            onClick={() => navigate(`/${category}/${lesson.id}`)} // Перехід до уроку
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

export default LessonsList;
