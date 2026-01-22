export type UserDataDTO = {
  code: Record<string, { html: string; css: string }>;
  progress: {
    completedLessons: string[];
    currentLessonId: string | null;
    taskStatus: Record<string, Record<string, boolean>>;
  };
};

export interface StorageAdapter {
  loadUserData(): Promise<UserDataDTO | null>;
  saveUserData(data: UserDataDTO): Promise<void>;
  clearUserData(): Promise<void>;
}
