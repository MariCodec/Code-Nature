import { useState } from "react";
import { lessonsData } from "../../data/lessonData";
import CodeEditor from "../CodeEditor/CodeEditor";
import styles from "./LessonPage.module.scss";
import { useParams } from "react-router-dom";

const LessonPage = () => {
  const [isLessonInfoVisible, setIsLessonInfoVisible] = useState(false);

  const toggleBtn = () => {
    setIsLessonInfoVisible((prevState) => !prevState);
    console.log(isLessonInfoVisible);
  };
  const { id } = useParams<{ id: string }>();
  console.log(id);

  const lesson = lessonsData.find((l) => l.id === Number(id));
  //  const lesson = lessonsData[0];

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
        <h3>Завдання:</h3>
        <p>{lesson.task}</p>
      </div>
      <CodeEditor
        initialHtml={lesson.initialHtml}
        initialCss={lesson.initialCss}
        initialJs={lesson.initialJs}
        toggleBtn={toggleBtn}
        isVisible={isLessonInfoVisible}
      />
    </div>
  );
};

export default LessonPage;
