import { useState } from "react";
import { useParams } from "react-router-dom";
// import { useSelector } from "react-redux";

import { lessons } from "../../data/lessonData";
import type { LessonCategory } from "../../types/lessonTypes";

import CodeEditor from "../../components/CodeEditor/CodeEditor";
import TaskList from "../../components/taskList/TasksList";
import LessonHeader from "../../components/lessonHeader/LessonHeader";

import styles from "./LessonPage.module.scss";
// import { RootState } from "../../store";
// import { selectLessonCode } from "../../store/slices/userCodeSlice";

const LessonPage = () => {
  const [isLessonInfoVisible, setIsLessonInfoVisible] = useState(false);
  const { category, id } = useParams<{
    category?: LessonCategory;
    id?: string;
  }>();

  const lesson =
    category && id ? lessons[category]?.find((l) => l.id === id) : undefined;

  if (!lesson) return <h2>Урок не знайдено</h2>;

  const toggleBtn = () => setIsLessonInfoVisible((prev) => !prev);

  // const lessonCode = useSelector((state: RootState) =>
  //   selectLessonCode(state, lesson.id),
  // );

  // console.log(lessonCode);

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.lessonInfo} ${isLessonInfoVisible ? styles.show : ""}`}
      >
        <div className={styles.sidebarCard}>
          <LessonHeader title={lesson.title} description={lesson.description} />
          <TaskList lessonId={lesson.id} tasks={lesson.tasks} />
        </div>
      </div>

      <CodeEditor
        key={lesson.id}
        lesson={lesson}
        toggleBtn={toggleBtn}
        isVisible={isLessonInfoVisible}
      />
    </div>
  );
};

export default LessonPage;
