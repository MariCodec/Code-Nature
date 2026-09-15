import type { LessonFileDTO, StudentSavedFileDTO } from "../types/content";

/**
 * Файл уроку разом із тим, що учень у ньому зараз має.
 *
 * `isEditable` навмисно живе тут, а не в `StudentSavedFileDTO`: той DTO їде
 * у сховище й далі на сервер, а «чи можна редагувати» — властивість **уроку**,
 * а не збереженого коду. Записати його в збережене означало б, що автор уроку
 * розблокує файл, а в учня він лишиться замкненим назавжди.
 */
export type LessonFileState = {
  id: string;
  name: string;
  language: string;
  content: string;
  isEditable: boolean;
};

/**
 * Поточний вміст файлів уроку: заготовка з контенту, поверх неї — збережене учнем.
 *
 * Перелік файлів беремо **з уроку**, а не з ключів збереженого коду. Та сама причина,
 * що й у `countCompletedTasks`: збережене переживає зміну контенту, тож файл,
 * якого автор уже не пише, інакше лишався б вкладкою назавжди — рівно так зʼявилось
 * колись «7 з 4 задач».
 *
 * Порожній вміст — це вміст: `??`, а не `||`. Учень, який стер файл начисто,
 * має побачити порожній файл, а не мовчки повернуту заготовку.
 */
export const buildLessonFileStates = (
  files: LessonFileDTO[],
  savedFiles: StudentSavedFileDTO[],
): LessonFileState[] =>
  [...files]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((file) => ({
      id: file.id,
      name: file.name,
      language: file.language,
      isEditable: file.isEditable,
      content:
        savedFiles.find((saved) => saved.name === file.name)?.content ??
        file.initialContent,
    }));

/** Те, що їде у сховище: без `id` і без `isEditable` — вони належать уроку. */
export const toSavedFiles = (files: LessonFileState[]): StudentSavedFileDTO[] =>
  files.map(({ name, language, content }) => ({ name, language, content }));
