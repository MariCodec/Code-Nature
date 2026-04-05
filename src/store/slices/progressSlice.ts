import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "..";
interface ProgressState {
  completedLessons: string[];
  currentLessonId: string | null;
  taskStatus: {
    [lessonId: string]: {
      [taskId: string]: boolean;
    };
  };
}

const initialState: ProgressState = {
  completedLessons: [],
  currentLessonId: null,
  taskStatus: {}, // { "lesson-1": { "task-1": true, "task-2": false }, ... }
};
const progressSlice = createSlice({
  name: "progress",
  initialState,
  reducers: {
    setCurrentLesson: (state, action: PayloadAction<string>) => {
      state.currentLessonId = action.payload;
    },
    markLessonAsCompleted: (state, action: PayloadAction<string>) => {
      if (!state.completedLessons.includes(action.payload)) {
        state.completedLessons.push(action.payload);
      }
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
    },
    resetProgress: (state) => {
      state.completedLessons = [];
      state.currentLessonId = null;
      state.taskStatus = {};
    },
    hydrateProgress: (_state, action: PayloadAction<ProgressState>) => {
      return action.payload;
    },
  },
});

export const {
  hydrateProgress,
  setCurrentLesson,
  markLessonAsCompleted,
  markTaskAsCompleted,
  resetProgress,
  resetTasksForLesson,
} = progressSlice.actions;
export const selectTaskStatus = (state: RootState, lessonId: string) =>
  state.progress.taskStatus[lessonId] || {};
export default progressSlice.reducer;
