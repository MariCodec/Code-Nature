import type { StudentSavedFileDTO } from "../types/content";

export type StudentCodeRecord = Record<
  string,
  {
    html: string;
    css: string;
    savedFiles?: StudentSavedFileDTO[];
  }
>;

export type StudentProgressRecord = {
  completedLessons: string[];
  currentLessonId: string | null;
  taskStatus: Record<string, Record<string, boolean>>;
};

const buildStudentCodeKey = (userId: string) => `student_code_v1:${userId}`;
const buildStudentProgressKey = (userId: string) => `student_progress_v1:${userId}`;

const readJson = <T,>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const writeJson = <T,>(key: string, value: T) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const studentApi = {
  async loadMyCode(userId: string): Promise<StudentCodeRecord | null> {
    return readJson<StudentCodeRecord>(buildStudentCodeKey(userId));
  },

  async saveMyCode(userId: string, code: StudentCodeRecord): Promise<void> {
    writeJson(buildStudentCodeKey(userId), code);
  },

  async clearMyCode(userId: string): Promise<void> {
    localStorage.removeItem(buildStudentCodeKey(userId));
  },

  async loadMyProgress(userId: string): Promise<StudentProgressRecord | null> {
    return readJson<StudentProgressRecord>(buildStudentProgressKey(userId));
  },

  async saveMyProgress(userId: string, progress: StudentProgressRecord): Promise<void> {
    writeJson(buildStudentProgressKey(userId), progress);
  },

  async clearMyProgress(userId: string): Promise<void> {
    localStorage.removeItem(buildStudentProgressKey(userId));
  },
};
