// TaskItem.tsx
import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import styles from "./TaskList.module.scss";

interface TaskItemProps {
  lessonId: string;
  task: { id: string; text: string };
  prevTaskId: string | null;
}

const TaskItem: React.FC<TaskItemProps> = ({ lessonId, task, prevTaskId }) => {
  const isCompleted = useSelector(
    (state: RootState) =>
      state.progress.taskStatus[lessonId]?.[task.id] ?? false
  );
  const prevCompleted = useSelector((state: RootState) =>
    prevTaskId ? state.progress.taskStatus[lessonId]?.[prevTaskId] : true
  );

  const isDisabled = !prevCompleted;

  return (
    <div
      className={`${styles.taskItem} ${isCompleted ? styles.completed : ""} ${
        isDisabled ? styles.disabled : ""
      }`}
    >
      <div className={styles.text}>
        <span>{task.id}.</span> <label>{task.text}</label>
      </div>
      <div className={styles.controls}>
        {isCompleted && <span className={styles.like}>👍</span>}
      </div>
    </div>
  );
};

// додаємо мемо для запобігання зайвим перерендеренням
export default React.memo(TaskItem);
