import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import type { LessonCategory } from "../../types/lessonTypes";
import { AppDispatch, RootState } from "../../store";

import CodeEditor from "../../components/CodeEditor/CodeEditor";
import TaskList from "../../components/taskList/TasksList";
import LessonHeader from "../../components/lessonHeader/LessonHeader";

import styles from "./LessonPage.module.scss";
import {
  fetchCourseLessons,
  fetchCoursesByTrack,
  fetchLessonById,
  selectContentError,
  selectCoursesByTrack,
  selectLessonById,
  selectLessonStatus,
} from "../../store/slices/contentSlice";
import { findCourseByLegacyCategory } from "../../utils/courseMapping";

const LessonPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [isLessonInfoVisible, setIsLessonInfoVisible] = useState(false);
  const { category, id } = useParams<{
    category?: LessonCategory;
    id?: string;
  }>();
  const frontendCourses = useSelector((state: RootState) =>
    selectCoursesByTrack(state, "frontend"),
  );
  const selectedCourse = category
    ? findCourseByLegacyCategory(frontendCourses, category)
    : null;
  const lessonDto = useSelector((state: RootState) =>
    id ? selectLessonById(state, id) : null,
  );
  const lessonStatus = useSelector((state: RootState) =>
    id ? selectLessonStatus(state, id) : "idle",
  );
  const contentError = useSelector(selectContentError);

  useEffect(() => {
    void dispatch(fetchCoursesByTrack("frontend"));
  }, [dispatch]);

  useEffect(() => {
    if (!selectedCourse) return;
    void dispatch(fetchCourseLessons(selectedCourse.id));
  }, [dispatch, selectedCourse]);

  useEffect(() => {
    if (!id) return;
    void dispatch(fetchLessonById(id));
  }, [dispatch, id]);

  if (contentError) return <h2>{contentError}</h2>;
  if (lessonStatus === "loading" || (id && !lessonDto)) return <h2>Завантаження уроку...</h2>;
  if (!category || !lessonDto) return <h2>Урок не знайдено</h2>;

  const toggleBtn = () => setIsLessonInfoVisible((prev) => !prev);

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.lessonInfo} ${isLessonInfoVisible ? styles.show : ""}`}
      >
        <div className={styles.sidebarCard}>
          <LessonHeader title={lessonDto.title} description={lessonDto.description} />
          <TaskList
            lessonId={lessonDto.id}
            tasks={lessonDto.tasks.map((task) => ({
              id: task.id,
              text: task.description,
            }))}
          />
        </div>
      </div>

      <CodeEditor
        key={lessonDto.id}
        lessonDto={lessonDto}
        toggleBtn={toggleBtn}
        isVisible={isLessonInfoVisible}
      />
    </div>
  );
};

export default LessonPage;
