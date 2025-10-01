// LessonChecker.tsx
import React, { useEffect } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { RootState } from "../../store";
import {
  markTaskAsCompleted,
  markLessonAsCompleted,
} from "../../store/slices/progressSlice";
import { LessonItem } from "../../types/lessonTypes";


interface LessonCheckerProps {
  lesson: LessonItem;
  userHtml: string;
  userCss: string;
}

const LessonChecker: React.FC<LessonCheckerProps> = ({
  lesson,
  userHtml,
  userCss,
}) => {
  const dispatch = useDispatch();

  // Мемоізований селектор для уникнення нових об'єктів
  const taskStatus = useSelector(
    (state: RootState) => state.progress.taskStatus[lesson.id] ?? {},
    shallowEqual
  );

  useEffect(() => {
    if (!lesson.tasks.length) return;

    // Створюємо прихований iframe для перевірки
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument;
    if (doc) {
      // Вставляємо HTML + CSS
      doc.documentElement.innerHTML = `
        <html>
          <head>
            <style>${userCss}</style>
          </head>
          <body>
            ${userHtml}
          </body>
        </html>
      `;

      // Перевірка завдань
      const completedTaskIds: string[] = [];

      lesson.tasks.forEach((task) => {
        if (!taskStatus[task.id]) {
          const success =
            task.validateHtmlCss?.(doc) ?? task.validate?.(doc) ?? false;

          if (success) {
            completedTaskIds.push(task.id);
          }
        }
      });

      // Диспатчимо лише якщо є нові виконані завдання
      if (completedTaskIds.length > 0) {
        completedTaskIds.forEach((taskId) => {
          dispatch(markTaskAsCompleted({ lessonId: lesson.id, taskId }));
        });
      }

      // Перевіряємо, чи всі завдання виконані
      const allTasksCompleted = lesson.tasks.every(
        (t) =>
          taskStatus[t.id] ||
          completedTaskIds.includes(t.id) ||
          (t.validateHtmlCss?.(doc) ?? t.validate?.(doc))
      );

      if (allTasksCompleted) {
        dispatch(markLessonAsCompleted(lesson.id));
      }
    }

    // Видаляємо iframe після перевірки
    document.body.removeChild(iframe);
  }, [lesson, userHtml, userCss, dispatch, taskStatus]);

  return null;
};

export default LessonChecker;
