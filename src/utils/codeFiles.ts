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
  /** Який файл пісочниця вантажить першим. Теж властивість **уроку**, не збереженого коду. */
  isEntry: boolean;
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
 *
 * **Заблокований файл збереженим не перекривається.** `isEditable: false` означає,
 * що цей файл пише автор уроку, а не учень, тож стара копія в сховищі — це не
 * «робота учня», це сміття, яке він навіть не може виправити: вкладка замкнена.
 * Саме так один раз уже сталося: у Фазі 3 `index.html` CSS-уроку отримав
 * `<link rel="stylesheet">`, а учні зі збереженою копією лишились би без стилів
 * і без способу це полагодити.
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
      isEntry: file.isEntry,
      content: file.isEditable
        ? savedFiles.find((saved) => saved.name === file.name)?.content ??
          file.initialContent
        : file.initialContent,
    }));

/** Те, що їде у сховище: без `id`, `isEditable` і `isEntry` — вони належать уроку. */
export const toSavedFiles = (files: LessonFileState[]): StudentSavedFileDTO[] =>
  files.map(({ name, language, content }) => ({ name, language, content }));
