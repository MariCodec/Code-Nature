import { AppDispatch } from "../store";
import {
  markLessonAsCompleted,
  markTaskAsCompleted,
} from "../store/slices/progressSlice";
import type { LessonDTO } from "../types/content";
import { getLessonCompletion } from "../domain/lessonCompletion";
import { isQuizRules } from "../domain/techCheck";
import type {
  SandboxCheckOutcome,
  SandboxCheckTask,
} from "../sandbox/useSandbox";

interface CheckLessonProps {
  lesson: Pick<LessonDTO, "id" | "validationType" | "tasks">;
  /**
   * Round-trip до пісочниці. Документ звідси не передається: сторінку складає
   * агент із файлів, які вже показані через `run` — як саме файли стають
   * сторінкою, властивість типу уроку, і в `js-dom` вона буде інша.
   */
  runCheck: (tasks: SandboxCheckTask[]) => Promise<SandboxCheckOutcome>;
  /** Уже зараховані завдання — щоб питання техчека не «губились» при запуску коду. */
  passedTaskIds?: Record<string, boolean>;
  dispatch: AppDispatch;
}

/**
 * Запускає перевірку в пісочниці й розносить результат у стан.
 *
 * **Асинхронність тут не деталь, а форма.** Код учня виконується за межами
 * origin застосунку, заглянути туди неможливо, тож замість «викликали —
 * результат є» лишається round-trip повідомленнями. Кожен виклик мусить уміти
 * «відповіді не буде ніколи» — саме тому повертається `SandboxCheckOutcome`,
 * а не масив: `timeout` це не порожній результат, це інший результат.
 *
 * Диспатч живе тут, а не у валідаторі: той чиста функція й нічого не знає
 * про Redux. Валідатор тепер узагалі в іншому вікні.
 */
export const checkLesson = async ({
  lesson,
  runCheck,
  passedTaskIds,
  dispatch,
}: CheckLessonProps): Promise<SandboxCheckOutcome> => {
  if (!lesson.tasks.length) return { status: "done", results: [] };

  // Питання техчека перевіряються не по DOM, а звіркою варіантів — у пісочницю
  // вони не їдуть узагалі.
  const domTasks: SandboxCheckTask[] = lesson.tasks
    .filter((task) => !isQuizRules(task.rules))
    .map((task) => ({ id: task.id, rules: task.rules }));

  const outcome: SandboxCheckOutcome = domTasks.length
    ? await runCheck(domTasks)
    : { status: "done", results: [] };

  if (outcome.status !== "done") return outcome;

  // Статус завдань після цього запуску: зараховане раніше (питання техчека вже
  // складені quiz-екраном) плюс те, що зійшлося щойно.
  const taskStatus: Record<string, boolean> = { ...passedTaskIds };
  for (const result of outcome.results) {
    if (!result.passed) continue;
    taskStatus[result.taskId] = true;
    dispatch(markTaskAsCompleted({ lessonId: lesson.id, taskId: result.taskId }));
  }

  // Чи завершено урок — вирішує правило з домену, а не цей файл: воно залежить
  // від `validationType`, і для `none`/`manual` «всі завдання пройшли» неправильне.
  const completion = getLessonCompletion({
    validationType: lesson.validationType,
    tasks: lesson.tasks,
    taskStatus,
    // Явна дія учня живе на сторінці уроку — там, де немає завдань.
    // Сюди вона дійти не може: цей файл викликається кнопкою Run, а Run є
    // лише в уроків із редактором, тобто саме там, де завдання є.
    isMarkedDone: false,
  });
  if (completion.completed) dispatch(markLessonAsCompleted(lesson.id));

  return outcome;
};
