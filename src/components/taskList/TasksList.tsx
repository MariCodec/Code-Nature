import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store";
import {
  markTaskAsCompleted,
  markLessonAsCompleted,
} from "../../store/slices/progressSlice";
import { checkTaskCompletion } from "../../utils/taskChecker";
import React, { useState } from "react";

import styles from "./TaskList.module.scss"; // створіть відповідний SCSS

const TaskList: React.FC<{
  lessonId: string;
  tasks: {
    id: string;
    text: string;
    correctHtml?: string;
    correctCss?: string;
  }[];
  userCode: { html: string; css: string };
}> = ({ tasks, userCode, lessonId }) => {
  const dispatch = useDispatch();
  const taskStatus = useSelector(
    (state: RootState) => state.progress.taskStatus
  );
  const [errorTaskId, setErrorTaskId] = useState<string | null>(null);

  const handleCheckTask = (task: (typeof tasks)[number], index: number) => {
    const isCorrect = checkTaskCompletion({
      userHtml: userCode.html,
      userCss: userCode.css,
      correctHtml: task.correctHtml,
      correctCss: task.correctCss,
    });

    if (isCorrect) {
      dispatch(markTaskAsCompleted(task.id));
      setErrorTaskId(null);
      // якщо це останнє завдання — відмічаємо урок завершеним
      if (index === tasks.length - 1) {
        dispatch(markLessonAsCompleted(lessonId));
      }
    } else {
      setErrorTaskId(task.id);
    }
  };

  return (
    <div className={styles.taskList}>
      <h3>Завдання:</h3>
      {tasks.map((task, index) => {
        const isCompleted = taskStatus[task.id] || false;
        const isDisabled = index > 0 && !taskStatus[tasks[index - 1].id];

        return (
          <div
            key={task.id}
            className={`${styles.taskItem} ${
              isCompleted ? styles.completed : ""
            } ${isDisabled ? styles.disabled : ""}`}
          >
            <div className={styles.text}>
              <span>{index + 1}.</span> <label>{task.text}</label>
            </div>

            <div className={styles.controls}>
              <input type="checkbox" checked={isCompleted} readOnly />
              {!isCompleted && !isDisabled && (
                <button onClick={() => handleCheckTask(task, index)}>
                  Перевірити
                </button>
              )}
            </div>

            {errorTaskId === task.id && (
              <div className={styles.error}>Спробуй ще раз</div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TaskList;
