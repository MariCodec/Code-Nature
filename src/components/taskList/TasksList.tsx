// TaskList.tsx
import React from "react";
import styles from "./TaskList.module.scss";
import TaskItem from "./TaskItem";

interface TaskListProps {
  lessonId: string;
  tasks: {
    id: string;
    text: string;
  }[];
}

const TaskList: React.FC<TaskListProps> = ({ tasks, lessonId }) => {
  return (
    <div className={styles.taskList}>
      <h3>Завдання:</h3>
      {tasks.map((task, index) => (
        <TaskItem
          key={task.id}
          lessonId={lessonId}
          task={task}
          prevTaskId={index > 0 ? tasks[index - 1].id : null}
        />
      ))}
    </div>
  );
};

export default TaskList;
