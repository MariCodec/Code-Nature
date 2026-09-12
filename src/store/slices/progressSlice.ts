import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "..";
interface ProgressState {
  completedLessons: string[];
  currentLessonId: string | null;
  lastActivityAt: string | null;
  videoStatus: {
    [lessonId: string]: boolean;
  };
  taskStatus: {
    [lessonId: string]: {
      [taskId: string]: boolean;
    };
  };
  /**
   * Чи цей стан відповідає збереженому для поточного користувача.
   *
   * Поки `false`, зберігати не можна: порожній стартовий стан ляже поверх
   * реального прогресу. Саме це й ставалось, коли сторінка уроку на монтуванні
   * зберігала дані, не дочекавшись `loadUserData`.
   */
  isHydrated: boolean;
}

/** Те, що приходить зі сховища: без службового прапорця. */
export type HydratedProgress = Omit<ProgressState, "isHydrated">;

const initialState: ProgressState = {
  completedLessons: [],
  currentLessonId: null,
  lastActivityAt: null,
  videoStatus: {},
  taskStatus: {}, // { "lesson-1": { "task-1": true, "task-2": false }, ... }
  isHydrated: false,
};

const touchProgressState = (state: ProgressState) => {
  state.lastActivityAt = new Date().toISOString();
};

const progressSlice = createSlice({
  name: "progress",
  initialState,
  reducers: {
    setCurrentLesson: (state, action: PayloadAction<string>) => {
      state.currentLessonId = action.payload;
      touchProgressState(state);
    },
    markLessonAsCompleted: (state, action: PayloadAction<string>) => {
      if (!state.completedLessons.includes(action.payload)) {
        state.completedLessons.push(action.payload);
      }
      touchProgressState(state);
    },
    markLessonVideoAsWatched: (state, action: PayloadAction<string>) => {
      state.videoStatus[action.payload] = true;
      touchProgressState(state);
    },
    markTaskAsCompleted: (
      state,
      action: PayloadAction<{ lessonId: string; taskId: string }>,
    ) => {
      const { lessonId, taskId } = action.payload;

      if (!state.taskStatus[lessonId]) {
        state.taskStatus[lessonId] = {};
      }

      state.taskStatus[lessonId][taskId] = true;
      touchProgressState(state);
    },
    resetTasksForLesson: (
      state,
      action: PayloadAction<{ lessonId: string; taskIds: string[] }>,
    ) => {
      const { lessonId, taskIds } = action.payload;
      state.taskStatus[lessonId] = {};
      taskIds.forEach((id) => {
        state.taskStatus[lessonId][id] = false;
      });
      touchProgressState(state);
    },
    touchProgress: (state) => {
      touchProgressState(state);
    },
    resetProgress: (state) => {
      state.completedLessons = [];
      state.currentLessonId = null;
      state.lastActivityAt = null;
      state.videoStatus = {};
      state.taskStatus = {};
      // Після виходу це вже не чийсь прогрес, а порожнеча: зберігати її нікуди.
      state.isHydrated = false;
    },
    hydrateProgress: (_state, action: PayloadAction<HydratedProgress>) => {
      return { ...action.payload, isHydrated: true };
    },
    setProgressHydrated: (state, action: PayloadAction<boolean>) => {
      state.isHydrated = action.payload;
    },
  },
});

export const {
  hydrateProgress,
  setCurrentLesson,
  markLessonAsCompleted,
  markLessonVideoAsWatched,
  markTaskAsCompleted,
  resetProgress,
  resetTasksForLesson,
  setProgressHydrated,
  touchProgress,
} = progressSlice.actions;
export const selectTaskStatus = (state: RootState, lessonId: string) =>
  state.progress.taskStatus[lessonId] || {};
export const selectIsProgressHydrated = (state: RootState) =>
  state.progress.isHydrated;
export default progressSlice.reducer;
