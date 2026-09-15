import { createSlice, PayloadAction, createSelector } from "@reduxjs/toolkit";

import { RootState } from "..";
import type { StudentSavedFileDTO } from "../../types/content";

/**
 * Код учня — **набір файлів уроку**, а не пара `html` + `css`.
 *
 * Пара трималась доти, доки всі уроки мали рівно `index.html` і `style.css`.
 * Розділ 5 PLATFORM_UA вимагає інше: скільки файлів у `files[]` уроку — стільки
 * вкладок, із тими іменами, що написані в контенті. Урок може мати один файл,
 * три або жодного, і `html`/`css` у стані означали б, що третій файл нікуди
 * зберігати, а урок із самим `index.html` тягне порожній `style.css`.
 *
 * Сховище вже жило у формі `savedFiles` (`studentApi`), тож пара була похідною
 * від збереженого — тобто зайвим шаром, який мовчки втрачав усе, що не влізло
 * в два імені.
 */
type LessonCode = {
  savedFiles: StudentSavedFileDTO[];
};

type UserCodeState = Record<string, LessonCode>;

const initialState: UserCodeState = {};

/** Одна константа на всі порожні уроки: селектор має повертати стабільне посилання. */
const EMPTY_LESSON_CODE: LessonCode = { savedFiles: [] };

const userCodeSlice = createSlice({
  name: "userCode",
  initialState,
  reducers: {
    /** Увесь набір одразу: запуск коду, скидання до заготовки уроку. */
    setLessonFiles: (
      state,
      action: PayloadAction<{ lessonId: string; savedFiles: StudentSavedFileDTO[] }>,
    ) => {
      state[action.payload.lessonId] = { savedFiles: action.payload.savedFiles };
    },
    /** Один файл змінився в редакторі. Ім'я — ключ: воно ж ім'я вкладки. */
    updateLessonFile: (
      state,
      action: PayloadAction<{ lessonId: string; file: StudentSavedFileDTO }>,
    ) => {
      const { lessonId, file } = action.payload;
      const lesson = state[lessonId] ?? { savedFiles: [] };
      const index = lesson.savedFiles.findIndex((saved) => saved.name === file.name);

      if (index >= 0) lesson.savedFiles[index] = file;
      else lesson.savedFiles.push(file);

      state[lessonId] = lesson;
    },
    resetUserCode: () => initialState,
    hydrateUserCode: (_state, action: PayloadAction<UserCodeState>) =>
      Object.fromEntries(
        Object.entries(action.payload).map(([lessonId, value]) => [
          lessonId,
          { savedFiles: value.savedFiles },
        ]),
      ),
  },
});

export const { hydrateUserCode, setLessonFiles, updateLessonFile, resetUserCode } =
  userCodeSlice.actions;

export const selectLessonCode = createSelector(
  (state: RootState) => state.userCode,
  (_: RootState, lessonId: string) => lessonId,
  (userCode, lessonId) => userCode[lessonId] ?? EMPTY_LESSON_CODE,
);

export default userCodeSlice.reducer;
