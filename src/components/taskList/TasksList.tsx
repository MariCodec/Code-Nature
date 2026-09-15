// TaskList.tsx
import React from "react";
import styles from "./TaskList.module.scss";
import TaskItem from "./TaskItem";

interface TaskListProps {
  lessonId: string;
  tasks: {
    id: string;
    text: string;
    hints: string[];
  }[];
}

const TaskList: React.FC<TaskListProps> = ({ tasks, lessonId }) => {
  return (
        <div className={styles.taskListWrapper}>
      <div className={styles.header}>
        <h3>Завдання</h3>
        <span className={styles.counter}>
          {tasks.length}
        </span>
      </div>

      <div className={styles.list}>
        {tasks.map((task, index) => (
          <TaskItem
            key={task.id}
            lessonId={lessonId}
            task={task}
            number={index + 1}
            prevTaskId={index > 0 ? tasks[index - 1].id : null}
          />
        ))}
      </div>
    </div>
  );
};

export default TaskList;
