import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  authApi,
  type LoginPayload,
  type RegisterPayload,
} from "../../api/authApi";
import {
  clearSession,
  setAuthError,
  setAuthStatus,
  setSession,
} from "../slices/authSlice";
import { loadUserData } from "./syncThunks";
import { resetProgress } from "../slices/progressSlice";
import { resetUserCode } from "../slices/userCodeSlice";

export const register = createAsyncThunk(
  "auth/register",
  async (payload: RegisterPayload, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setAuthStatus("loading"));
      dispatch(setAuthError(null));

      const session = await authApi.register(payload);
      dispatch(setSession(session));
      await dispatch(loadUserData());

      return session;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Register failed";
      dispatch(setAuthStatus("failed"));
      dispatch(setAuthError(message));
      return rejectWithValue(message);
    }
  },
);

export const login = createAsyncThunk(
  "auth/login",
  async (payload: LoginPayload, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setAuthStatus("loading"));
      dispatch(setAuthError(null));

      const session = await authApi.login(payload);
      dispatch(setSession(session));
      await dispatch(loadUserData());

      return session;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Login failed";
      dispatch(setAuthStatus("failed"));
      dispatch(setAuthError(message));
      return rejectWithValue(message);
    }
  },
);

export const loadSession = createAsyncThunk(
  "auth/loadSession",
  async (_, { dispatch }) => {
    dispatch(setAuthStatus("loading"));
    dispatch(setAuthError(null));

    const session = await authApi.loadSession();

    if (session) {
      dispatch(setSession(session));
      // setSession вже ставить status "succeeded"
      return session;
    }

    dispatch(setAuthStatus("idle"));
    return null;
  },
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { dispatch }) => {
    await authApi.logout();
    dispatch(clearSession());
    dispatch(resetProgress());
    dispatch(resetUserCode());
  },
);
