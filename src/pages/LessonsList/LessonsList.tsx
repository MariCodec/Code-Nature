import { FaCheckCircle, FaHourglassHalf } from "react-icons/fa";
import { useEffect } from "react";
import styles from "./LessonsList.module.scss";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { useNavigate, useParams } from "react-router-dom";
import type { LessonCategory } from "../../types/lessonTypes";
import {
  fetchCourseLessons,
  fetchCoursesByTrack,
  selectContentError,
  selectCourseLessons,
  selectCourseLessonsStatus,
  selectCoursesByTrack,
} from "../../store/slices/contentSlice";
import { findCourseByLegacyCategory } from "../../utils/courseMapping";

const LessonsList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { category } = useParams<{ category?: LessonCategory }>();

  const completedLessons = useSelector(
    (state: RootState) => state.progress.completedLessons,
  );
  const contentError = useSelector(selectContentError);
  const frontendCourses = useSelector((state: RootState) =>
    selectCoursesByTrack(state, "frontend"),
  );
  const selectedCourse = category
    ? findCourseByLegacyCategory(frontendCourses, category)
    : null;
  const categoryLessons = useSelector((state: RootState) =>
    selectedCourse ? selectCourseLessons(state, selectedCourse.id) : [],
  );
  const lessonsStatus = useSelector((state: RootState) =>
    selectedCourse ? selectCourseLessonsStatus(state, selectedCourse.id) : "idle",
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

  if (contentError) {
    return <h2>{contentError}</h2>;
  }

  if (selectedCourse && lessonsStatus === "loading" && categoryLessons.length === 0) {
    return <h2>Завантаження уроків...</h2>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h2 className={styles.heading}>
          {selectedCourse?.title ?? `${category.toUpperCase()} Уроки`}
        </h2>

        <div className={styles.lessonCardContainer}>
          {categoryLessons.map((lesson) => (
            <div
              key={lesson.id}
              className={`${styles.lessonCard} ${
                completedLessons.includes(lesson.id) ? styles.completedCard : ""
              }`}
              onClick={() => navigate(`/student/${category}/${lesson.id}`)}
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
      </div>
    </div>
  );
};

export default LessonsList;
