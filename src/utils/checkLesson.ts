// utils/checkLesson.ts
import { AppDispatch } from "../store";
import {
  markTaskAsCompleted,
  markLessonAsCompleted,
} from "../store/slices/progressSlice";
import { LessonItem } from "../types/lessonTypes";
import { validateHtmlCss } from "./validateHtmlCss";

interface CheckLessonProps {
  lesson: LessonItem;
  userHtml: string; // явна назва
  userCss: string; // явна назва
  dispatch: AppDispatch;
}

export const checkLesson = ({
  lesson,
  userHtml,
  userCss,
  dispatch,
}: CheckLessonProps) => {
  if (!lesson.tasks.length) return;

  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) return;

  doc.documentElement.innerHTML = `
    <html>
      <head><style>${userCss}</style></head>
      <body>${userHtml}</body>
    </html>
  `;

  const completedTaskIds: string[] = [];

  lesson.tasks.forEach((task) => {
    const success = validateHtmlCss(userHtml, doc, {
      htmlSelectors: task.htmlSelectors ?? [],
      cssChecks: task.cssChecks,
    });

    if (success) {
      completedTaskIds.push(task.id);
    }
  });

  completedTaskIds.forEach((taskId) => {
    dispatch(markTaskAsCompleted({ lessonId: lesson.id, taskId }));
  });

  const allTasksCompleted = lesson.tasks.every((t) =>
    completedTaskIds.includes(t.id)
  );

  if (allTasksCompleted) {
    dispatch(markLessonAsCompleted(lesson.id));
  }

  document.body.removeChild(iframe);
};
