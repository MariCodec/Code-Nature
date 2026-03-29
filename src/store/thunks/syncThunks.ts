import { createAsyncThunk } from "@reduxjs/toolkit";
import { studentApi } from "../../api/studentApi";
import { RootState } from "../index";
import { hydrateUserCode } from "../slices/userCodeSlice";
import { hydrateProgress } from "../slices/progressSlice";

export const loadUserData = createAsyncThunk(
  "sync/loadUserData",
  async (_, { dispatch, getState }) => {
    const state = getState() as RootState;
    const user = state.auth.user;

    if (!user || user.role !== "student") {
      return null;
    }

    const [code, progress] = await Promise.all([
      studentApi.loadMyCode(user.id),
      studentApi.loadMyProgress(user.id),
    ]);

    if (code) {
      dispatch(hydrateUserCode(code));
    }

    if (progress) {
      dispatch(hydrateProgress(progress));
    }

    return { code, progress };
  },
);

export const saveUserData = createAsyncThunk(
  "sync/saveUserData",
  async (_, { getState }) => {
    const state = getState() as RootState;
    const user = state.auth.user;

    if (!user || user.role !== "student") {
      return;
    }

    await Promise.all([
      studentApi.saveMyCode(user.id, state.userCode),
      studentApi.saveMyProgress(user.id, state.progress),
    ]);
  },
);
