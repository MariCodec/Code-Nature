import { AppDispatch } from "../store";
import {
  markLessonAsCompleted,
  markTaskAsCompleted,
} from "../store/slices/progressSlice";
import type { LessonTaskDTO } from "../types/content";
import { validateHtmlCss } from "./validateHtmlCss";

interface CheckLessonProps {
  lessonId: string;
  tasks: LessonTaskDTO[];
  userHtml: string;
  userCss: string;
  dispatch: AppDispatch;
}

export const checkLesson = ({
  lessonId,
  tasks,
  userHtml,
  userCss,
  dispatch,
}: CheckLessonProps) => {
  if (!tasks.length) return;

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

    for (const task of tasks) {
      const success = validateHtmlCss(doc, {
        htmlSelectors: task.rules?.htmlSelectors ?? [],
        cssChecks: task.rules?.cssChecks ?? [],
        requireTextContains: task.rules?.requireTextContains ?? [],
      });

      if (success) completedTaskIds.push(task.id);
    }

    for (const taskId of completedTaskIds) {
      dispatch(markTaskAsCompleted({ lessonId, taskId }));
    }

    const allTasksCompleted = tasks.every((t) =>
      completedTaskIds.includes(t.id),
    );
    if (allTasksCompleted) dispatch(markLessonAsCompleted(lessonId));
  } finally {
    document.body.removeChild(iframe);
  }
};
