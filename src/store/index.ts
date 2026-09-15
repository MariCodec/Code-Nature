import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "./slices/themeSlice";
import progressReducer from "./slices/progressSlice";
import userCodeReducer from "./slices/userCodeSlice";
import authReducer from "./slices/authSlice";
import contentReducer from "./slices/contentSlice";
/**
 * Редюсер лишається, хоч викладацьких маршрутів уже немає: селектори `teacherSlice`
 * типізуються через `RootState`, тож прибрати його звідси — означає зламати `tsc`
 * у замороженому коді. Піде разом із самим слайсом, коли зʼявиться справжній
 * `/teacher/*` API — див. позначку в `slices/teacherSlice.ts`.
 */
import teacherReducer from "./slices/teacherSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    content: contentReducer,
    teacher: teacherReducer,
    theme: themeReducer,
    progress: progressReducer,
    userCode: userCodeReducer,
  },
});
export type RootState = ReturnType<typeof store.getState>; // Тип кореневого стану
export type AppDispatch = typeof store.dispatch;
export default store;
