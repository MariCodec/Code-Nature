import { createAsyncThunk } from "@reduxjs/toolkit";
import { studentApi, type StudentProgressRecord } from "../../api/studentApi";
import type {
  StudentLessonProgressDTO,
  StudentTaskProgressDTO,
  StudentVideoProgressDTO,
} from "../../types/content";
import { RootState } from "../index";
import { hydrateUserCode } from "../slices/userCodeSlice";
import { hydrateProgress, setProgressHydrated } from "../slices/progressSlice";
import { buildLessonCourseMap } from "../../domain/lessonCourses";

const toHydratedProgressState = (progress: StudentProgressRecord) => {
  const completedLessons = progress.lessonProgress
    .filter((lesson) => lesson.status === "completed")
    .map((lesson) => lesson.lessonId);

  const taskStatus = progress.taskProgress.reduce<Record<string, Record<string, boolean>>>(
    (acc, task) => {
      if (!task.isCompleted) return acc;

      if (!acc[task.lessonId]) {
        acc[task.lessonId] = {};
      }

      acc[task.lessonId][task.taskId] = true;
      return acc;
    },
    {},
  );
  const videoStatus = progress.videoProgress.reduce<Record<string, boolean>>(
    (acc, video) => {
      if (video.isWatched) {
        acc[video.lessonId] = true;
      }
      return acc;
    },
    {},
  );
  const lastActivityCandidates = [
    ...progress.lessonProgress.flatMap((lesson) => [
      lesson.startedAt,
      lesson.completedAt,
      lesson.updatedAt,
    ]),
    ...progress.taskProgress.flatMap((task) => [task.completedAt, task.updatedAt]),
    ...progress.videoProgress.flatMap((video) => [video.watchedAt, video.updatedAt]),
  ].filter((value): value is string => typeof value === "string");
  const lastActivityAt =
    lastActivityCandidates.length > 0
      ? lastActivityCandidates.reduce((latest, value) =>
          value > latest ? value : latest,
        )
      : null;

  return {
    completedLessons,
    currentLessonId: progress.currentLessonId,
    lastActivityAt,
    videoStatus,
    taskStatus,
  };
};

/**
 * Прогрес без курсу не зберігається взагалі — див. розділ 6 PLATFORM_UA:
 * `course_id` обовʼязковий, фолбеків немає. Якщо курс уроку зараз невідомий
 * (контент ще не завантажився, а уроку немає й у збереженому), рядок просто
 * не пишеться цього разу: наступне збереження додасть його вже з курсом.
 * Вигадати `unknown_course` означало б зіпсувати дані замість відкласти запис.
 */
const toPersistedProgressRecord = (
  state: RootState,
  courseByLessonId: Record<string, string>,
): StudentProgressRecord => {
  const progress = state.progress;
  const now = progress.lastActivityAt ?? new Date().toISOString();

  const lessonIds = new Set<string>([
    ...progress.completedLessons,
    ...Object.keys(progress.taskStatus),
    ...(progress.currentLessonId ? [progress.currentLessonId] : []),
  ]);

  const lessonProgress: StudentLessonProgressDTO[] = Array.from(lessonIds).flatMap(
    (lessonId) => {
      const courseId = courseByLessonId[lessonId];
      if (!courseId) return [];

      const hasCompletedTasks = Object.values(progress.taskStatus[lessonId] ?? {}).some(
        Boolean,
      );
      const isCompleted = progress.completedLessons.includes(lessonId);

      return [
        {
          lessonId,
          courseId,
          status: isCompleted
            ? "completed"
            : hasCompletedTasks || progress.currentLessonId === lessonId
              ? "in_progress"
              : "not_started",
          startedAt: null,
          completedAt: isCompleted ? now : null,
          updatedAt: now,
        },
      ];
    },
  );

  const taskProgress: StudentTaskProgressDTO[] = Object.entries(progress.taskStatus).flatMap(
    ([lessonId, tasks]) => {
      const courseId = courseByLessonId[lessonId];
      if (!courseId) return [];

      return Object.entries(tasks)
        .filter(([, isCompleted]) => isCompleted)
        .map(([taskId]) => ({
          lessonId,
          taskId,
          courseId,
          isCompleted: true,
          completedAt: now,
          updatedAt: now,
        }));
    },
  );
  const videoProgress: StudentVideoProgressDTO[] = Object.entries(
    progress.videoStatus,
  )
    .filter(([, isWatched]) => isWatched)
    .flatMap(([lessonId]) => {
      const courseId = courseByLessonId[lessonId];
      if (!courseId) return [];

      return [
        {
          lessonId,
          courseId,
          isWatched: true,
          watchedAt: now,
          updatedAt: now,
        },
      ];
    });

  return {
    currentLessonId: progress.currentLessonId,
    lessonProgress,
    taskProgress,
    videoProgress,
  };
};

export const loadUserData = createAsyncThunk(
  "sync/loadUserData",
  async (_, { dispatch, getState }) => {
    const state = getState() as RootState;
    const user = state.auth.user;

    if (!user || user.role !== "student") {
      // Піднімати нічого, але й затирати нічого: гість і викладач прогрес не зберігають.
      dispatch(setProgressHydrated(true));
      return null;
    }

    // Поточний стан ще не належить цьому користувачеві — до кінця завантаження
    // збереження заборонене.
    dispatch(setProgressHydrated(false));

    try {
      const [code, progress] = await Promise.all([
        studentApi.loadMyCode(user.id),
        studentApi.loadMyProgress(user.id),
      ]);

      if (code) {
        dispatch(hydrateUserCode(code));
      }

      if (progress) {
        dispatch(hydrateProgress(toHydratedProgressState(progress)));
      }

      // Збереженого прогресу могло не бути зовсім — це теж відповідь,
      // і вона так само відкриває збереження.
      dispatch(setProgressHydrated(true));

      return { code, progress };
    } catch (error) {
      // Читання впало — зберігати не можна: порожній стан ліг би поверх уцілілого.
      dispatch(setProgressHydrated(false));
      throw error;
    }
  },
);

export const saveUserData = createAsyncThunk(
  "sync/saveUserData",
  async (_, { getState }) => {
    const state = getState() as RootState;
    const user = state.auth.user;

    if (!user || user.role !== "student") {
      return;
    }

    // Головна охорона: поки збережений стан не піднято, цей — стартовий і порожній.
    // Саме це знищувало прогрес, коли сторінка уроку зберігала дані на монтуванні,
    // не дочекавшись `loadUserData`.
    if (!state.progress.isHydrated) {
      return;
    }

    const persistedProgress = await studentApi.loadMyProgress(user.id);
    const courseByLessonId = buildLessonCourseMap({
      saved: persistedProgress
        ? [
            ...persistedProgress.lessonProgress,
            ...persistedProgress.taskProgress,
            ...persistedProgress.videoProgress,
          ]
        : [],
      lessonsByModule: state.content.lessonsByModule,
      lessonById: state.content.lessonById,
    });

    await Promise.all([
      studentApi.saveMyCode(user.id, state.userCode),
      studentApi.saveMyProgress(
        user.id,
        toPersistedProgressRecord(state, courseByLessonId),
      ),
    ]);
  },
);
