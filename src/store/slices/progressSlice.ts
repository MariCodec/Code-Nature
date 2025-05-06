import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ProgressState {
  completedLessons: string[];
  currentLessonId: string | null;
  taskStatus: { [taskId: string]: boolean }; // статус по кожному завданню
}

const initialState: ProgressState = {
  completedLessons: [],
  currentLessonId: null,
  taskStatus: {}, // { "task-1": true, "task-2": false }
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
    markTaskAsCompleted: (state, action: PayloadAction<string>) => {
      state.taskStatus[action.payload] = true;
    },
    resetProgress: (state) => {
      state.completedLessons = [];
      state.currentLessonId = null;
      state.taskStatus = {};
    },
  },
});

export const {
  setCurrentLesson,
  markLessonAsCompleted,
  markTaskAsCompleted,
  resetProgress,
} = progressSlice.actions;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const selectTaskStatus = (state: any) => state.progress.taskStatus;
export default progressSlice.reducer;
