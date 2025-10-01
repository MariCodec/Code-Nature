import { useState } from "react";
import { useParams } from "react-router-dom";
import { lessons } from "../../data/lessonData";
import { Lessons } from "../../types/lessonTypes";

import CodeEditor from "../CodeEditor/CodeEditor";
import TaskList from "../taskList/TasksList";
import LessonChecker from "../lessonChecker/LessonChecker";
import styles from "./LessonPage.module.scss";

const LessonPage = () => {
  const [isLessonInfoVisible, setIsLessonInfoVisible] = useState(false);
  const [userCode, setUserCode] = useState({ html: "", css: "" });

  const { category, id } = useParams<{ category: string; id: string }>();


  const lesson = lessons[category as keyof Lessons]?.find(
    (lesson) => lesson.id === id
  );

  if (!lesson) return <h2>Урок не знайдено</h2>;

  const toggleBtn = () => setIsLessonInfoVisible((prev) => !prev);

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.lessonInfo} ${
          isLessonInfoVisible ? styles.show : ""
        }`}
      >
        <h1>{lesson.title}</h1>
        <p>{lesson.description}</p>

        {/* Список завдань */}
        <TaskList
          lessonId={lesson.id}
          tasks={lesson.tasks}
         
        />
      </div>

      {/* CodeEditor */}
      <CodeEditor
         key={lesson.id}
        initialHtml={lesson.initialHtml}
        initialCss={lesson.initialCss}
        toggleBtn={toggleBtn}
        isVisible={isLessonInfoVisible}
        currentLessonId={lesson.id}
        setUserCode={setUserCode}
      />

      {/* Перевірка завдань */}
      <LessonChecker
        lesson={lesson}
        userHtml={userCode.html}
        userCss={userCode.css}
      />
    </div>
  );
};

export default LessonPage;
