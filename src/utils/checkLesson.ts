import { AppDispatch } from "../store";
import {
  markLessonAsCompleted,
  markTaskAsCompleted,
} from "../store/slices/progressSlice";
import type { LessonDTO } from "../types/content";
import { getLessonCompletion } from "../domain/lessonCompletion";
import { checkTask } from "../domain/taskValidation";
import type { TaskResult } from "../domain/runner";
import { isQuizRules } from "../domain/techCheck";

interface CheckLessonProps {
  lesson: Pick<LessonDTO, "id" | "validationType" | "tasks" | "videos">;
  userHtml: string;
  userCss: string;
  /** Уже зараховані завдання — щоб питання техчека не «губились» при запуску коду. */
  passedTaskIds?: Record<string, boolean>;
  isVideoWatched: boolean;
  dispatch: AppDispatch;
}

/**
 * Запускає валідатор по завданнях уроку і розносить результат у стан.
 *
 * Диспатч живе тут, а не у валідаторі: той чиста функція й нічого не знає про Redux.
 * Повертає результат по кожному завданню, щоб інтерфейс міг сказати, **що саме**
 * не зійшлося, — заради цього валідатор і рахує правила поодинці.
 *
 * Прямий доступ до `contentDocument` лишається до Фази 3: там iframe стане
 * замкненою пісочницею, і це місце перетвориться на round-trip повідомленнями.
 */
export const checkLesson = ({
  lesson,
  userHtml,
  userCss,
  passedTaskIds,
  isVideoWatched,
  dispatch,
}: CheckLessonProps): TaskResult[] => {
  if (!lesson.tasks.length) return [];

  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument;
    if (!doc) return [];

    doc.documentElement.innerHTML = `
      <html>
        <head><style>${userCss}</style></head>
        <body>${userHtml}</body>
      </html>
    `;

    // Питання техчека перевіряються не по DOM, а звіркою варіантів — тут їх пропускаємо.
    const results: TaskResult[] = lesson.tasks
      .filter((task) => !isQuizRules(task.rules))
      .map((task) => {
        const check = checkTask(doc, task.rules);
        return { taskId: task.id, passed: check.passed, rules: check.rules };
      });

    // Статус завдань після цього запуску: зараховане раніше (питання техчека вже
    // складені quiz-екраном) плюс те, що зійшлося щойно.
    const taskStatus: Record<string, boolean> = { ...passedTaskIds };
    for (const result of results) {
      if (!result.passed) continue;
      taskStatus[result.taskId] = true;
      dispatch(markTaskAsCompleted({ lessonId: lesson.id, taskId: result.taskId }));
    }

    // Чи завершено урок — вирішує правило з домену, а не цей файл: воно залежить
    // від `validationType`, і для `none`/`manual` «всі завдання пройшли» неправильне.
    const completion = getLessonCompletion({
      validationType: lesson.validationType,
      tasks: lesson.tasks,
      videos: lesson.videos,
      taskStatus,
      isVideoWatched,
      // Кнопки «Пройдено» ще немає — вона потрібна лише урокам без завдань
      // і без обовʼязкового відео, а такі приїдуть із контентом у Фазі 2.
      isMarkedDone: false,
    });
    if (completion.completed) dispatch(markLessonAsCompleted(lesson.id));

    return results;
  } finally {
    document.body.removeChild(iframe);
  }
};
