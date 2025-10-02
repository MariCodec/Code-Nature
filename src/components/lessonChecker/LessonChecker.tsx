// LessonChecker.tsx
import React, { useEffect } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { RootState } from "../../store";
import {
  markTaskAsCompleted,
  markLessonAsCompleted,
} from "../../store/slices/progressSlice";
import { LessonItem } from "../../types/lessonTypes";
import { isHtmlWellFormed } from "../../utils/validateHtmlCss"; 
import { validateHtmlCss } from "../../utils/validateHtmlCss";

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
  console.log(userHtml);
  console.log(isHtmlWellFormed(userHtml));
  // Мемоізований селектор для уникнення нових об'єктів
  const taskStatus = useSelector(
    (state: RootState) => state.progress.taskStatus[lesson.id] ?? {},
    shallowEqual
  );

  useEffect(() => {
    if (!lesson.tasks.length) return;

     if (!isHtmlWellFormed(userHtml)) {
       console.warn("HTML має помилки у тегах");
       return; // зупиняємо перевірку, якщо теги не закриті
     }
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
           const success = validateHtmlCss(userHtml, doc, {
             htmlSelectors: task.htmlSelectors ?? [],
             cssChecks: task.cssChecks,
           });;

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
