import { createSlice, PayloadAction, createSelector } from "@reduxjs/toolkit";

import { RootState } from "..";

interface LessonCode {
  html: string;
  css: string;
}

interface UserCodeState {
  [lessonId: string]: LessonCode;
}

const initialState: UserCodeState = {};

const userCodeSlice = createSlice({
  name: "userCode",
  initialState,
  reducers: {
    setLessonCode: (
      state,
      action: PayloadAction<{ lessonId: string; html: string; css: string }>,
    ) => {
      const { lessonId, html, css } = action.payload;
      state[lessonId] = { html, css };
    },
    updateHtml: (
      state,
      action: PayloadAction<{ lessonId: string; html: string }>,
    ) => {
      if (!state[action.payload.lessonId]) {
        state[action.payload.lessonId] = { html: "", css: "" };
      }
      state[action.payload.lessonId].html = action.payload.html;
    },
    updateCss: (
      state,
      action: PayloadAction<{ lessonId: string; css: string }>,
    ) => {
      if (!state[action.payload.lessonId]) {
        state[action.payload.lessonId] = { html: "", css: "" };
      }
      state[action.payload.lessonId].css = action.payload.css;
    },
    resetLessonCode: (state, action: PayloadAction<{ lessonId: string }>) => {
      state[action.payload.lessonId] = { html: "", css: "" };
    },
    // + у reducers:
    hydrateUserCode: (_state, action: PayloadAction<UserCodeState>) => {
      return action.payload;
    },
  },
});


  export const {
    hydrateUserCode,
    setLessonCode,
    updateHtml,
    updateCss,
    resetLessonCode,
  } = userCodeSlice.actions;

export const selectLessonCode = createSelector(
  (state: RootState) => state.userCode,
  (_: RootState, lessonId: string) => lessonId,
  (userCode, lessonId) => {
    return userCode[lessonId] ?? { html: "", css: "" };
  }
);

export default userCodeSlice.reducer;
