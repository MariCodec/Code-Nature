import { AppDispatch } from "../store";
import {
  markLessonAsCompleted,
  markTaskAsCompleted,
} from "../store/slices/progressSlice";
import type { LessonContent } from "../types/lessonTypes";
import { validateHtmlCss } from "./validateHtmlCss";

interface CheckLessonProps {
  lesson: LessonContent;
  userHtml: string;
  userCss: string;
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

  try {
    const doc = iframe.contentDocument;
    if (!doc) return;

    doc.documentElement.innerHTML = `
      <html>
        <head><style>${userCss}</style></head>
        <body>${userHtml}</body>
      </html>
    `;

    const completedTaskIds: string[] = [];

    for (const task of lesson.tasks) {
      const success = validateHtmlCss(userHtml, doc, {
        htmlSelectors: task.rules?.htmlSelectors ?? [],
        cssChecks: task.rules?.cssChecks ?? [],
        requireTextContains: task.rules?.requireTextContains ?? [],
      });

      if (success) completedTaskIds.push(task.id);
    }

    for (const taskId of completedTaskIds) {
      dispatch(markTaskAsCompleted({ lessonId: lesson.id, taskId }));
    }

    const allTasksCompleted = lesson.tasks.every((t) =>
      completedTaskIds.includes(t.id),
    );
    if (allTasksCompleted) dispatch(markLessonAsCompleted(lesson.id));
  } finally {
    document.body.removeChild(iframe);
  }
};
