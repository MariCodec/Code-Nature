import { StorageAdapter, UserDataDTO } from "./types";

const KEY = "htmlcss_user_data_v1";

export const localStorageAdapter: StorageAdapter = {
  async loadUserData() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return JSON.parse(raw) as UserDataDTO;
    } catch {
      return null;
    }
  },

  async saveUserData(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  },

  async clearUserData() {
    localStorage.removeItem(KEY);
  },
};
