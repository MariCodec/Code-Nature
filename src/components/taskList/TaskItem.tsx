// TaskItem.tsx
import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import styles from "./TaskList.module.scss";
import InlineMarkdown from "../markdown/InlineMarkdown";
import TaskHints from "./TaskHints";

interface TaskItemProps {
  lessonId: string;
  task: { id: string; text: string; hints: string[] };
  prevTaskId: string | null;
  number: number;
}

const TaskItem: React.FC<TaskItemProps> = ({ lessonId, task, prevTaskId, number }) => {
  const isCompleted = useSelector(
    (state: RootState) =>
      state.progress.taskStatus[lessonId]?.[task.id] ?? false
  );
  const prevCompleted = useSelector((state: RootState) =>
    prevTaskId ? state.progress.taskStatus[lessonId]?.[prevTaskId] : true
  );

  const isDisabled = !prevCompleted;
  const isActive = !isCompleted && !isDisabled; 
  return (
    <div
      className={`${styles.taskItem}
        ${isCompleted ? styles.completed : ""}
        ${isDisabled ? styles.disabled : ""}
        ${isActive ? styles.active : ""}`}
    >
      <div className={styles.left}>
        <span className={styles.index}>{number}</span>
      </div>
      <div className={styles.text}>
        <InlineMarkdown text={task.text} />
        {/* Підказки лише там, де вони ще потрібні: до зарахованого завдання
            вони вже нічого не пояснюють, а до замкненого — розкривають наперед. */}
        {isActive && <TaskHints hints={task.hints} />}
      </div>
      <div className={styles.controls}>
        {isCompleted && (
          <span className={`${styles.iconBadge} ${styles.pop}`}>✓</span>
        )}
        {isDisabled && <span className={styles.icon}>🔒</span>}
      </div>
    </div>
  );
};


export default React.memo(TaskItem);
