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
  /**
   * Чи ми вже питали сховище про сесію. Це не те саме, що `status`: той описує
   * останній запит входу, а це — чи взагалі відома відповідь на питання «хто це».
   *
   * Без цього прапорця гвард на першому рендері бачить `user: null` і не може
   * зрозуміти, це «сесії немає» чи «ще не встигли підняти» — і викидає на /login
   * при кожному F5.
   */
  isSessionResolved: boolean;
};

const initialState: AuthState = {
  user: null,
  tokens: null,
  status: "idle",
  error: null,
  isSessionResolved: false,
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
      state.isSessionResolved = true;
    },
    clearSession: (state) => {
      state.user = null;
      state.tokens = null;
      state.status = "idle";
      state.error = null;
      // Після виходу відповідь відома: сесії немає. Скидати прапорець не можна —
      // інакше застосунок знову вирішить, що ще не знає, і зависне.
      state.isSessionResolved = true;
    },
    markSessionResolved: (state) => {
      state.isSessionResolved = true;
    },
    setAuthStatus: (state, action: PayloadAction<AuthStatus>) => {
      state.status = action.payload;
    },
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setSession,
  clearSession,
  markSessionResolved,
  setAuthStatus,
  setAuthError,
} = authSlice.actions;

export default authSlice.reducer;

// selectors
export const selectAuthUser = (state: RootState) => state.auth.user;
export const selectAuthTokens = (state: RootState) => state.auth.tokens;
export const selectIsAuthenticated = (state: RootState) => Boolean(state.auth.user);
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectIsSessionResolved = (state: RootState) =>
  state.auth.isSessionResolved;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectAuthRole = (state: RootState) => state.auth.user?.role ?? null;
