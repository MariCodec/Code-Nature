import { createAsyncThunk } from "@reduxjs/toolkit";
import { storage } from "../../storage";
import { RootState } from "../index";
import { hydrateUserCode } from "../slices/userCodeSlice";
import { hydrateProgress } from "../slices/progressSlice";

export const loadUserData = createAsyncThunk(
  "sync/loadUserData",
  async (_, { dispatch }) => {
    const data = await storage.loadUserData();
    if (!data) return;

    dispatch(hydrateUserCode(data.code));
    dispatch(hydrateProgress(data.progress));
  },
);

export const saveUserData = createAsyncThunk(
  "sync/saveUserData",
  async (_, { getState }) => {
    const state = getState() as RootState;

    await storage.saveUserData({
      code: state.userCode,
      progress: state.progress,
    });
  },
);
