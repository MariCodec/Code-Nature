import { AppDispatch } from "../store";
import {
  markLessonAsCompleted,
  markTaskAsCompleted,
} from "../store/slices/progressSlice";
import type { LessonTaskDTO } from "../types/content";
import { validateHtmlCss } from "./validateHtmlCss";
import { isQuizRules } from "../domain/techCheck";
import type { DomTaskRules } from "../types/lessonTypes";

interface CheckLessonProps {
  lessonId: string;
  tasks: LessonTaskDTO[];
  userHtml: string;
  userCss: string;
  /** Уже зараховані завдання — щоб питання техчека не «губились» при запуску коду. */
  passedTaskIds?: Record<string, boolean>;
  dispatch: AppDispatch;
}

export const checkLesson = ({
  lessonId,
  tasks,
  userHtml,
  userCss,
  passedTaskIds,
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

    // Питання техчека перевіряються не по DOM, а звіркою варіантів — тут їх пропускаємо.
    for (const task of tasks) {
      if (isQuizRules(task.rules)) continue;

      const rules = task.rules as DomTaskRules;
      const success = validateHtmlCss(doc, {
        htmlSelectors: rules.htmlSelectors ?? [],
        cssChecks: rules.cssChecks ?? [],
        requireTextContains: rules.requireTextContains ?? [],
      });

      if (success) completedTaskIds.push(task.id);
    }

    for (const taskId of completedTaskIds) {
      dispatch(markTaskAsCompleted({ lessonId, taskId }));
    }

    // Урок завершено, коли зараховані ВСІ завдання, включно з питаннями:
    // їх зарахував quiz-екран раніше, тож враховуємо вже збережений статус.
    const allTasksCompleted = tasks.every(
      (t) => completedTaskIds.includes(t.id) || passedTaskIds?.[t.id],
    );
    if (allTasksCompleted) dispatch(markLessonAsCompleted(lessonId));
  } finally {
    document.body.removeChild(iframe);
  }
};
