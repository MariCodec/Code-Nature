// import { useState } from "react";
// import { htmlLessons, cssLessons } from "../../data/lessonData";

// import CodeEditor from "../CodeEditor/CodeEditor";
// import styles from "./LessonPage.module.scss";
// import { useParams } from "react-router-dom";

// const LessonPage = () => {
//   const [isLessonInfoVisible, setIsLessonInfoVisible] = useState(false);

//   const toggleBtn = () => {
//     setIsLessonInfoVisible((prevState) => !prevState);
//     console.log(isLessonInfoVisible);
//   };
//   const { id } = useParams<{ id: string }>();
//   console.log(id);

//   const lesson =
//     htmlLessons.find((lesson) => lesson.id === id) ||
//     cssLessons.find((lesson) => lesson.id === id);
//   //  const lesson = lessonsData[0];

//   if (!lesson) return <h2>Урок не знайдено</h2>;

//   return (
//     <div className={styles.wrapper}>
//       <div
//         className={`${styles.lessonInfo} ${
//           isLessonInfoVisible ? styles.show : ""
//         }`}
//       >
//         <h1>{lesson.title}</h1>
//         <p>{lesson.description}</p>
//         <h3>Завдання:</h3>
//         <p>{lesson.task}</p>
//       </div>
//       <CodeEditor
//         initialHtml={lesson.initialHtml}
//         initialCss={lesson.initialCss}
//         initialJs={lesson.initialJs}
//         toggleBtn={toggleBtn}
//         isVisible={isLessonInfoVisible}
//       />
//     </div>
//   );
// };

// export default LessonPage;
import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  markLessonAsCompleted,
  setCurrentLesson,
} from "../../store/slices/progressSlice";
import { htmlLessons, cssLessons } from "../../data/lessonData";
import CodeEditor from "../CodeEditor/CodeEditor";
import styles from "./LessonPage.module.scss";
import { RootState } from "../../store"; // Імпортуємо тип RootState

const LessonPage = () => {
  const [isLessonInfoVisible, setIsLessonInfoVisible] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const completedLessons = useSelector(
    (state: RootState) => state.progress.completedLessons
  );

  useEffect(() => {
    if (id) {
      dispatch(setCurrentLesson(id)); // Оновлюємо поточний урок в Redux
    }
  }, [id, dispatch]);

  const lessonIndex = htmlLessons.findIndex((lesson) => lesson.id === id);
  const lesson =
    htmlLessons[lessonIndex] || cssLessons.find((lesson) => lesson.id === id);

  if (!lesson) return <h2>Урок не знайдено</h2>;

  const isCompleted = completedLessons.includes(lesson.id);
  const isLastLesson = lessonIndex === htmlLessons.length - 1;
  const nextLessonId = !isLastLesson ? htmlLessons[lessonIndex + 1].id : null;

  const handleCompleteLesson = () => {
    dispatch(markLessonAsCompleted(lesson.id));
  };

  const handleNextLesson = () => {
    if (nextLessonId) {
      navigate(`/lesson/${nextLessonId}`);
    }
  };

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

        <button onClick={handleCompleteLesson} disabled={isCompleted}>
          Завершити урок
        </button>
        {isCompleted && <span> (Завершено)</span>}

        <button
          onClick={handleNextLesson}
          disabled={!isCompleted || isLastLesson}
        >
          Наступний урок
        </button>
      </div>

      <CodeEditor
        initialHtml={lesson.initialHtml}
        initialCss={lesson.initialCss}
        initialJs={lesson.initialJs}
        toggleBtn={() => setIsLessonInfoVisible((prev) => !prev)}
        isVisible={isLessonInfoVisible}
      />
    </div>
  );
};

export default LessonPage;
