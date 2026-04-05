import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "./slices/themeSlice";
import progressReducer from "./slices/progressSlice";
import userCodeReducer from "./slices/userCodeSlice";
import authReducer from "./slices/authSlice";
import contentReducer from "./slices/contentSlice";
import teacherReducer from "./slices/teacherSlice";
// import lessonReducer from "./slices/lessonSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    content: contentReducer,
    teacher: teacherReducer,
    theme: themeReducer,
    progress: progressReducer,
    userCode: userCodeReducer,
    // lesson: lessonReducer,
  },
});
export type RootState = ReturnType<typeof store.getState>; // Тип кореневого стану
export type AppDispatch = typeof store.dispatch;
export default store;
