import { createSlice, PayloadAction, createSelector } from "@reduxjs/toolkit";

import { RootState } from "..";
import type { StudentSavedFileDTO } from "../../types/content";
import {
  buildSavedFiles,
  getCssFromSavedFiles,
  getHtmlFromSavedFiles,
} from "../../utils/codeFiles";

interface LessonCode {
  html: string;
  css: string;
  savedFiles: StudentSavedFileDTO[];
}

interface UserCodeState {
  [lessonId: string]: LessonCode;
}

const initialState: UserCodeState = {};

type LessonCodePayload = {
  lessonId: string;
  html: string;
  css: string;
};

type HydratableLessonCode =
  | {
      html: string;
      css: string;
      savedFiles?: StudentSavedFileDTO[];
    }
  | {
      savedFiles: StudentSavedFileDTO[];
      html?: string;
      css?: string;
    };

const createLessonCode = (html: string, css: string): LessonCode => ({
  html,
  css,
  savedFiles: buildSavedFiles(html, css),
});

const normalizeLessonCode = (value: HydratableLessonCode): LessonCode => {
  if (value.savedFiles?.length) {
    const html = value.html ?? getHtmlFromSavedFiles(value.savedFiles);
    const css = value.css ?? getCssFromSavedFiles(value.savedFiles);

    return {
      html,
      css,
      savedFiles: value.savedFiles,
    };
  }

  return createLessonCode(value.html ?? "", value.css ?? "");
};

const userCodeSlice = createSlice({
  name: "userCode",
  initialState,
  reducers: {
    setLessonCode: (state, action: PayloadAction<LessonCodePayload>) => {
      const { lessonId, html, css } = action.payload;
      state[lessonId] = createLessonCode(html, css);
    },
    updateHtml: (
      state,
      action: PayloadAction<{ lessonId: string; html: string }>,
    ) => {
      if (!state[action.payload.lessonId]) {
        state[action.payload.lessonId] = createLessonCode("", "");
      }
      state[action.payload.lessonId].html = action.payload.html;
      state[action.payload.lessonId].savedFiles = buildSavedFiles(
        action.payload.html,
        state[action.payload.lessonId].css,
      );
    },
    updateCss: (
      state,
      action: PayloadAction<{ lessonId: string; css: string }>,
    ) => {
      if (!state[action.payload.lessonId]) {
        state[action.payload.lessonId] = createLessonCode("", "");
      }
      state[action.payload.lessonId].css = action.payload.css;
      state[action.payload.lessonId].savedFiles = buildSavedFiles(
        state[action.payload.lessonId].html,
        action.payload.css,
      );
    },
    resetLessonCode: (state, action: PayloadAction<{ lessonId: string }>) => {
      state[action.payload.lessonId] = createLessonCode("", "");
    },
    resetUserCode: () => {
      return initialState;
    },
    hydrateUserCode: (
      _state,
      action: PayloadAction<Record<string, HydratableLessonCode>>,
    ) => {
      return Object.fromEntries(
        Object.entries(action.payload).map(([lessonId, value]) => [
          lessonId,
          normalizeLessonCode(value),
        ]),
      );
    },
  },
});


  export const {
    hydrateUserCode,
    setLessonCode,
    updateHtml,
    updateCss,
    resetLessonCode,
    resetUserCode,
  } = userCodeSlice.actions;

export const selectLessonCode = createSelector(
  (state: RootState) => state.userCode,
  (_: RootState, lessonId: string) => lessonId,
  (userCode, lessonId) => {
    return userCode[lessonId] ?? createLessonCode("", "");
  }
);

export default userCodeSlice.reducer;
