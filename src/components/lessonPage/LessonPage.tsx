import { useState } from "react";
import { lessons } from "../../data/lessonData";

import CodeEditor from "../CodeEditor/CodeEditor";
import styles from "./LessonPage.module.scss";
import { useParams } from "react-router-dom";
import { Lessons } from "../../types/lessonTypes";
import TaskList from "../taskList/TasksList";

const LessonPage = () => {
  const [isLessonInfoVisible, setIsLessonInfoVisible] = useState(false);
  const [userCode, setUserCode] = useState({ html: "", css: "" });
  const toggleBtn = () => {
    setIsLessonInfoVisible((prevState) => !prevState);
    console.log(isLessonInfoVisible);
  };
  const { category, id } = useParams<{ category: string; id: string }>(); // Отримуємо category і id

  const lesson = lessons[category as keyof Lessons]?.find(
    (lesson) => lesson.id === id
  );

  if (!lesson) return <h2>Урок не знайдено</h2>;

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.lessonInfo} ${
          isLessonInfoVisible ? styles.show : ""
        }`}
      >
        <h1>{lesson.title}</h1>
        <p>{lesson.description}</p>
        {/* <h3>Завдання:</h3> */}
        <TaskList
          lessonId={lesson.id}
          tasks={lesson.tasks}
          // initialCss={lesson.initialCss}
          userCode={userCode}
        />
      </div>
      <CodeEditor
        initialHtml={lesson.initialHtml}
        initialCss={lesson.initialCss}
        // initialJs={lesson.initialJs}
        toggleBtn={toggleBtn}
        isVisible={isLessonInfoVisible}
        currentLessonId={lesson.id}
        setUserCode={setUserCode}
      />
    </div>
  );
};

export default LessonPage;
