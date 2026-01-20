import { useState } from "react";
import { useParams } from "react-router-dom";
import { lessons } from "../../data/lessonData";
import { Lessons } from "../../types/lessonTypes";

import CodeEditor from "../CodeEditor/CodeEditor";
import TaskList from "../taskList/TasksList";
import styles from "./LessonPage.module.scss";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { selectLessonCode } from "../../store/slices/userCodeSlice";

const LessonPage = () => {
  const [isLessonInfoVisible, setIsLessonInfoVisible] = useState(false);
  const { category, id } = useParams<{ category: string; id: string }>();

  const lesson = lessons[category as keyof Lessons]?.find(
    (lesson) => lesson.id === id
  );

  if (!lesson) return <h2>Урок не знайдено</h2>;

  const toggleBtn = () => setIsLessonInfoVisible((prev) => !prev);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const lessonCode = useSelector((state: RootState) =>
    selectLessonCode(state, lesson.id)
  );
console.log(lessonCode);
console.log(lesson);

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.lessonInfo} ${isLessonInfoVisible ? styles.show : ""}`}
      >
        <div className={styles.lessonHeader}>
          <div className={styles.lessonTitle}>
            <h1>{lesson.title}</h1>
            <p>{lesson.description}</p>
          </div>
        </div>

        <TaskList lessonId={lesson.id} tasks={lesson.tasks} />
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
