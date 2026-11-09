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

/**
 * `isHydrated` — окреме питання «чи піднято збережений код», і воно **не те саме**,
 * що `progress.isHydrated`: код і прогрес читаються двома різними запитами
 * (`loadMyCode` / `loadMyProgress`), а у Фазі 8 стануть двома HTTP-викликами, які
 * цілком можуть завершитись у різний час.
 *
 * Без цього прапорця редактор створював модель Monaco із **заготовки** уроку, бо
 * збережений код ще не приїхав. Модель створюється один раз на файл і `defaultValue`
 * більше не застосовується, тож редактор так і лишався б із заготовкою, поки прев'ю
 * й перевірка читали б збережений код зі стану. Перше натискання клавіші записало б
 * заготовку поверх роботи учня.
 *
 * Сьогодні це не спрацьовує лише тому, що Monaco вантажиться довше за читання
 * `localStorage` — тобто дані виграють гонку випадково. Фаза 8 цю випадковість зніме.
 */
type UserCodeState = {
  lessons: Record<string, LessonCode>;
  isHydrated: boolean;
};

/** Те, що приходить зі сховища: без службового прапорця. */
export type HydratedUserCode = Record<string, LessonCode>;

const initialState: UserCodeState = {
  lessons: {},
  isHydrated: false,
};

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
      state.lessons[action.payload.lessonId] = { savedFiles: action.payload.savedFiles };
    },
    /** Один файл змінився в редакторі. Ім'я — ключ: воно ж ім'я вкладки. */
    updateLessonFile: (
      state,
      action: PayloadAction<{ lessonId: string; file: StudentSavedFileDTO }>,
    ) => {
      const { lessonId, file } = action.payload;
      const lesson = state.lessons[lessonId] ?? { savedFiles: [] };
      const index = lesson.savedFiles.findIndex((saved) => saved.name === file.name);

      if (index >= 0) lesson.savedFiles[index] = file;
      else lesson.savedFiles.push(file);

      state.lessons[lessonId] = lesson;
    },
    resetUserCode: () => initialState,
    hydrateUserCode: (_state, action: PayloadAction<HydratedUserCode>) => ({
      lessons: Object.fromEntries(
        Object.entries(action.payload).map(([lessonId, value]) => [
          lessonId,
          { savedFiles: value.savedFiles },
        ]),
      ),
      isHydrated: true,
    }),
    setUserCodeHydrated: (state, action: PayloadAction<boolean>) => {
      state.isHydrated = action.payload;
    },
  },
});

export const {
  hydrateUserCode,
  setLessonFiles,
  updateLessonFile,
  resetUserCode,
  setUserCodeHydrated,
} = userCodeSlice.actions;

export const selectLessonCode = createSelector(
  (state: RootState) => state.userCode.lessons,
  (_: RootState, lessonId: string) => lessonId,
  (lessons, lessonId) => lessons[lessonId] ?? EMPTY_LESSON_CODE,
);

export const selectIsUserCodeHydrated = (state: RootState) => state.userCode.isHydrated;

/** Те, що йде у сховище: службовий прапорець туди не потрапляє. */
export const selectPersistableUserCode = (state: RootState) => state.userCode.lessons;

export default userCodeSlice.reducer;
