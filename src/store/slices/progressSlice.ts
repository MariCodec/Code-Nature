import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ProgressState {
  completedLessons: string[]; // список завершених уроків
  currentLessonId: string | null; // поточний урок
}

const initialState: ProgressState = {
  completedLessons: [], // початковий стан — порожній список
  currentLessonId: null, // без поточного уроку на початку
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
    resetProgress: (state) => {
      state.completedLessons = [];
      state.currentLessonId = null;
    },
  },
});

export const { setCurrentLesson, markLessonAsCompleted, resetProgress } =
  progressSlice.actions;
export default progressSlice.reducer;
