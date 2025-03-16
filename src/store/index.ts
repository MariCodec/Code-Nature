import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "./slices/themeSlice";
import progressReducer from "./slices/progressSlice";
// import lessonReducer from "./slices/lessonSlice";

const store = configureStore({
  reducer: {
    theme: themeReducer,
    progress: progressReducer,
    // lesson: lessonReducer,
  },
});
export type RootState = ReturnType<typeof store.getState>; // Тип кореневого стану

export default store;
