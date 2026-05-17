import type {
  StudentLessonProgressDTO,
  StudentSavedFileDTO,
  StudentTaskProgressDTO,
  StudentVideoProgressDTO,
} from "../types/content";

export type StudentCodeRecord = Record<
  string,
  {
    savedFiles: StudentSavedFileDTO[];
  }
>;

export type StudentProgressRecord = {
  currentLessonId: string | null;
  lessonProgress: StudentLessonProgressDTO[];
  taskProgress: StudentTaskProgressDTO[];
  videoProgress: StudentVideoProgressDTO[];
};

const buildStudentCodeKey = (userId: string) => `student_code_v1:${userId}`;
const buildStudentProgressKey = (userId: string) => `student_progress_v1:${userId}`;

const isSavedFile = (value: unknown): value is StudentSavedFileDTO => {
  if (!value || typeof value !== "object") return false;

  const file = value as Partial<StudentSavedFileDTO>;
  return (
    typeof file.name === "string" &&
    typeof file.language === "string" &&
    typeof file.content === "string"
  );
};

const normalizeCodeRecord = (value: unknown): StudentCodeRecord | null => {
  if (!value || typeof value !== "object") return null;

  const entries = Object.entries(value as Record<string, unknown>)
    .map(([lessonId, lessonValue]) => {
      if (!lessonValue || typeof lessonValue !== "object") return null;

      const record = lessonValue as {
        savedFiles?: unknown;
        html?: unknown;
        css?: unknown;
      };

      const savedFiles = Array.isArray(record.savedFiles)
        ? record.savedFiles.filter(isSavedFile)
        : [];

      if (savedFiles.length === 0) {
        return null;
      }

      return [lessonId, { savedFiles }] as const;
    })
    .filter((entry): entry is readonly [string, { savedFiles: StudentSavedFileDTO[] }] => Boolean(entry));

  return Object.fromEntries(entries);
};

const normalizeProgressRecord = (value: unknown): StudentProgressRecord | null => {
  if (!value || typeof value !== "object") return null;

  const progress = value as Partial<
    StudentProgressRecord & {
      completedLessons?: unknown;
      taskStatus?: unknown;
    }
  >;
  const currentLessonId =
    typeof progress.currentLessonId === "string" ? progress.currentLessonId : null;

  if (Array.isArray(progress.lessonProgress) || Array.isArray(progress.taskProgress)) {
    const lessonProgress = Array.isArray(progress.lessonProgress)
      ? progress.lessonProgress.filter(
          (item): item is StudentLessonProgressDTO =>
            Boolean(
              item &&
                typeof item.lessonId === "string" &&
                typeof item.courseId === "string" &&
                (item.status === "not_started" ||
                  item.status === "in_progress" ||
                  item.status === "completed") &&
                typeof item.updatedAt === "string",
            ),
        )
      : [];

    const taskProgress = Array.isArray(progress.taskProgress)
      ? progress.taskProgress.filter(
          (item): item is StudentTaskProgressDTO =>
            Boolean(
              item &&
                typeof item.lessonId === "string" &&
                typeof item.taskId === "string" &&
                typeof item.courseId === "string" &&
                typeof item.isCompleted === "boolean" &&
                typeof item.updatedAt === "string",
            ),
        )
      : [];

    const videoProgress = Array.isArray(progress.videoProgress)
      ? progress.videoProgress.filter(
          (item): item is StudentVideoProgressDTO =>
            Boolean(
              item &&
                typeof item.lessonId === "string" &&
                typeof item.courseId === "string" &&
                typeof item.isWatched === "boolean" &&
                typeof item.updatedAt === "string",
            ),
        )
      : [];

    return {
      currentLessonId,
      lessonProgress,
      taskProgress,
      videoProgress,
    };
  }

  const completedLessons = Array.isArray(progress.completedLessons)
    ? progress.completedLessons.filter(
        (lessonId): lessonId is string => typeof lessonId === "string",
      )
    : [];

  const rawTaskStatus =
    progress.taskStatus && typeof progress.taskStatus === "object"
      ? progress.taskStatus
      : {};

  const now = new Date().toISOString();
  const taskProgress = Object.entries(rawTaskStatus).flatMap(([lessonId, tasks]) => {
    if (!tasks || typeof tasks !== "object") return [];

    return Object.entries(tasks)
      .filter(
        (entry): entry is [string, boolean] =>
          typeof entry[0] === "string" && entry[1] === true,
      )
      .map(([taskId]) => ({
        lessonId,
        taskId,
        courseId: "unknown_course",
        isCompleted: true,
        completedAt: now,
        updatedAt: now,
      }));
  });

  const lessonIds = new Set<string>([
    ...completedLessons,
    ...Object.keys(rawTaskStatus as Record<string, unknown>),
    ...(currentLessonId ? [currentLessonId] : []),
  ]);

  const lessonProgress = Array.from(lessonIds).map((lessonId) => ({
    lessonId,
    courseId: "unknown_course",
    status: (
      completedLessons.includes(lessonId) ? "completed" : "in_progress"
    ) as StudentLessonProgressDTO["status"],
    startedAt: null,
    completedAt: completedLessons.includes(lessonId) ? now : null,
    updatedAt: now,
  }));

  return {
    currentLessonId,
    lessonProgress,
    taskProgress,
    videoProgress: [],
  };
};

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
    return normalizeCodeRecord(readJson<unknown>(buildStudentCodeKey(userId)));
  },

  async saveMyCode(userId: string, code: StudentCodeRecord): Promise<void> {
    const persistedCode = Object.fromEntries(
      Object.entries(code).map(([lessonId, lessonCode]) => [
        lessonId,
        { savedFiles: lessonCode.savedFiles },
      ]),
    );

    writeJson(buildStudentCodeKey(userId), persistedCode);
  },

  async clearMyCode(userId: string): Promise<void> {
    localStorage.removeItem(buildStudentCodeKey(userId));
  },

  async loadMyProgress(userId: string): Promise<StudentProgressRecord | null> {
    return normalizeProgressRecord(
      readJson<unknown>(buildStudentProgressKey(userId)),
    );
  },

  async saveMyProgress(userId: string, progress: StudentProgressRecord): Promise<void> {
    writeJson(buildStudentProgressKey(userId), progress);
  },

  async clearMyProgress(userId: string): Promise<void> {
    localStorage.removeItem(buildStudentProgressKey(userId));
  },
};
