
import styles from "./HtmlLesson1.module.scss";
import React, { useState } from "react";
import CodeEditor from "../../../components/CodeEditor/CodeEditor";

const HtmlLesson1: React.FC = () => {
  const [isLessonInfoVisible, setIsLessonInfoVisible] = useState(false);

  const toggleBtn = () => {
    setIsLessonInfoVisible((prevState) => !prevState);
    console.log(isLessonInfoVisible);
  };

  return (
    <div className={styles.wrapper}>

      <div
        className={`${styles.lessonInfo} ${
          isLessonInfoVisible ? styles.show : ""
        }`}
      >
        {/* <h2>{lessonTitle}</h2>
        <p>{lessonDescription}</p>
        <h3>Завдання:</h3>
        <p>{task}</p> */}
      </div>

      <CodeEditor
        initialHtml={`<h1>Привіт, HTML!</h1>`}
        initialCss={`h1 {
    color: red;
   }`}
        initialJs={`console.log("Hello, JavaScript!");`}
        toggleBtn={toggleBtn}
        isVisible={isLessonInfoVisible}
      />
    </div>
  );
};

export default HtmlLesson1;
