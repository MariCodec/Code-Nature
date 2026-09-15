/**
 * ЗАМОРОЖЕНО, а не забуто. Маршрути викладача вимкнені в `App.tsx`: розділ 2
 * PLATFORM_UA каже «роль зарезервована, без функціоналу», розділ 7 — «Teacher API
 * прибрано з MVP цілком», і поки ці екрани були підключені, правило незмінності
 * («прибери викладача — платформа має працювати повністю») неможливо було перевірити.
 *
 * Файл лишений свідомо як орієнтир для майбутніх екранів.
 *
 * ТРИГЕР ВИДАЛЕННЯ: поява справжнього `/teacher/*` API. Нинішній `teacherApi` будує
 * список учнів перебором ключів `localStorage` поточного браузера, тож переписаний
 * він буде повністю, а не доопрацьований.
 */

import type {
  TeacherStudentCodeSnapshotDTO,
  TeacherStudentDetailsDTO,
  TeacherStudentListItemDTO,
} from "../types/content";
import { studentApi } from "./studentApi";

const STUDENT_CODE_KEY_PREFIX = "student_code_v1:";
const STUDENT_PROGRESS_KEY_PREFIX = "student_progress_v1:";

const formatStudentName = (userId: string) => {
  const localPart = userId.split("@")[0] ?? userId;
  if (!localPart) return "Student";

  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getKnownStudentIds = (): string[] => {
  const ids = new Set<string>();

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key) continue;

    if (key.startsWith(STUDENT_CODE_KEY_PREFIX)) {
      ids.add(key.slice(STUDENT_CODE_KEY_PREFIX.length));
    }

    if (key.startsWith(STUDENT_PROGRESS_KEY_PREFIX)) {
      ids.add(key.slice(STUDENT_PROGRESS_KEY_PREFIX.length));
    }
  }

  return Array.from(ids).sort();
};

const getLastActivityAt = (updatedAtValues: Array<string | null | undefined>) => {
  const validValues = updatedAtValues.filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  );

  if (validValues.length === 0) {
    return null;
  }

  return validValues.sort().at(-1) ?? null;
};

const buildStudentSummary = async (
  studentId: string,
): Promise<TeacherStudentDetailsDTO> => {
  const [progress, code] = await Promise.all([
    studentApi.loadMyProgress(studentId),
    studentApi.loadMyCode(studentId),
  ]);

  const lessonProgress = progress?.lessonProgress ?? [];
  const taskProgress = progress?.taskProgress ?? [];
  const codeSnapshots: TeacherStudentCodeSnapshotDTO[] = Object.entries(code ?? {}).map(
    ([lessonId, lessonCode]) => ({
      lessonId,
      savedFiles: lessonCode.savedFiles,
      updatedAt: null,
    }),
  );

  const completedLessonsCount = lessonProgress.filter(
    (lesson) => lesson.status === "completed",
  ).length;
  const lastActivityAt = getLastActivityAt([
    ...lessonProgress.map((lesson) => lesson.updatedAt),
    ...taskProgress.map((task) => task.updatedAt),
    ...codeSnapshots.map((snapshot) => snapshot.updatedAt),
  ]);

  return {
    id: studentId,
    name: formatStudentName(studentId),
    email: studentId,
    currentLessonId: progress?.currentLessonId ?? null,
    completedLessonsCount,
    lastActivityAt,
    lessonProgress,
    taskProgress,
    codeSnapshots,
  };
};

export const teacherApi = {
  async getStudents(): Promise<TeacherStudentListItemDTO[]> {
    const studentIds = getKnownStudentIds();
    const students = await Promise.all(studentIds.map(buildStudentSummary));

    return students.map((student) => ({
      id: student.id,
      name: student.name,
      email: student.email,
      completedLessonsCount: student.completedLessonsCount,
      currentLessonId: student.currentLessonId,
      lastActivityAt: student.lastActivityAt,
    }));
  },

  async getStudentById(
    studentId: string,
  ): Promise<TeacherStudentDetailsDTO | null> {
    const knownStudentIds = getKnownStudentIds();
    if (!knownStudentIds.includes(studentId)) {
      return null;
    }

    return buildStudentSummary(studentId);
  },

  async getStudentProgress(studentId: string) {
    const student = await this.getStudentById(studentId);
    if (!student) return null;

    return {
      currentLessonId: student.currentLessonId,
      lessonProgress: student.lessonProgress,
      taskProgress: student.taskProgress,
    };
  },

  async getStudentCode(studentId: string, lessonId: string) {
    const student = await this.getStudentById(studentId);
    if (!student) return null;

    return student.codeSnapshots.find((snapshot) => snapshot.lessonId === lessonId) ?? null;
  },
};
