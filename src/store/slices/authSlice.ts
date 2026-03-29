import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../index";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "student" | "teacher";
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthStatus = "idle" | "loading" | "succeeded" | "failed";

export type AuthState = {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  status: AuthStatus;
  error: string | null;
};

const initialState: AuthState = {
  user: null,
  tokens: null,
  status: "idle",
  error: null,
};

type SessionPayload = {
  user: AuthUser;
  tokens: AuthTokens;
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<SessionPayload>) => {
      state.user = action.payload.user;
      state.tokens = action.payload.tokens;
      state.status = "succeeded";
      state.error = null;
    },
    clearSession: (state) => {
      state.user = null;
      state.tokens = null;
      state.status = "idle";
      state.error = null;
    },
    setAuthStatus: (state, action: PayloadAction<AuthStatus>) => {
      state.status = action.payload;
    },
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setSession, clearSession, setAuthStatus, setAuthError } =
  authSlice.actions;

export default authSlice.reducer;

// selectors
export const selectAuthUser = (state: RootState) => state.auth.user;
export const selectAuthTokens = (state: RootState) => state.auth.tokens;
export const selectIsAuthenticated = (state: RootState) => Boolean(state.auth.user);
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectAuthRole = (state: RootState) => state.auth.user?.role ?? null;
