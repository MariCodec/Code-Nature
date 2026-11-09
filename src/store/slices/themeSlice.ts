import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "..";

export type ThemeName = "dark" | "light";

const STORAGE_KEY = "theme_v1";

const readStoredTheme = (): ThemeName => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "dark";
  } catch {
    return "dark";
  }
};

type ThemeState = { theme: ThemeName };

const themeSlice = createSlice({
  name: "theme",
  initialState: { theme: readStoredTheme() } as ThemeState,
  reducers: {
    setTheme(state, action: PayloadAction<ThemeName>) {
      state.theme = action.payload;
    },
    toggleTheme(state) {
      state.theme = state.theme === "dark" ? "light" : "dark";
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export const selectTheme = (state: RootState) => state.theme.theme;
export default themeSlice.reducer;
