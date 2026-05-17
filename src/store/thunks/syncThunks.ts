import { createAsyncThunk } from "@reduxjs/toolkit";
import { studentApi, type StudentProgressRecord } from "../../api/studentApi";
import type { StudentLessonProgressDTO, StudentTaskProgressDTO } from "../../types/content";
import { RootState } from "../index";
import { hydrateUserCode } from "../slices/userCodeSlice";
import { hydrateProgress } from "../slices/progressSlice";

const buildLessonCourseMap = (state: RootState): Record<string, string> => {
  const fromLessonDetails = Object.values(state.content.lessonById).reduce<
    Record<string, string>
  >((acc, lesson) => {
    acc[lesson.id] = lesson.courseId;
    return acc;
  }, {});

  const fromModuleLessonLists = Object.values(state.content.lessonsByModule).reduce<
    Record<string, string>
  >((acc, lessons) => {
    lessons.forEach((lesson) => {
      acc[lesson.id] = lesson.courseId;
    });
    return acc;
  }, {});

  return {
    ...fromModuleLessonLists,
    ...fromLessonDetails,
  };
};

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
  const lastActivityCandidates = [
    ...progress.lessonProgress.flatMap((lesson) => [
      lesson.startedAt,
      lesson.completedAt,
      lesson.updatedAt,
    ]),
    ...progress.taskProgress.flatMap((task) => [task.completedAt, task.updatedAt]),
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
    taskStatus,
  };
};

const toPersistedProgressRecord = (state: RootState): StudentProgressRecord => {
  const progress = state.progress;
  const now = progress.lastActivityAt ?? new Date().toISOString();
  const courseByLessonId = buildLessonCourseMap(state);

  const lessonIds = new Set<string>([
    ...progress.completedLessons,
    ...Object.keys(progress.taskStatus),
    ...(progress.currentLessonId ? [progress.currentLessonId] : []),
  ]);

  const lessonProgress: StudentLessonProgressDTO[] = Array.from(lessonIds).map(
    (lessonId) => {
      const hasCompletedTasks = Object.values(progress.taskStatus[lessonId] ?? {}).some(
        Boolean,
      );
      const isCompleted = progress.completedLessons.includes(lessonId);

      return {
        lessonId,
        courseId: courseByLessonId[lessonId] ?? "unknown_course",
        status: isCompleted
          ? "completed"
          : hasCompletedTasks || progress.currentLessonId === lessonId
            ? "in_progress"
            : "not_started",
        startedAt: null,
        completedAt: isCompleted ? now : null,
        updatedAt: now,
      };
    },
  );

  const taskProgress: StudentTaskProgressDTO[] = Object.entries(progress.taskStatus).flatMap(
    ([lessonId, tasks]) =>
      Object.entries(tasks)
        .filter(([, isCompleted]) => isCompleted)
        .map(([taskId]) => ({
          lessonId,
          taskId,
          courseId: courseByLessonId[lessonId] ?? "unknown_course",
          isCompleted: true,
          completedAt: now,
          updatedAt: now,
        })),
  );

  return {
    currentLessonId: progress.currentLessonId,
    lessonProgress,
    taskProgress,
  };
};

export const loadUserData = createAsyncThunk(
  "sync/loadUserData",
  async (_, { dispatch, getState }) => {
    const state = getState() as RootState;
    const user = state.auth.user;

    if (!user || user.role !== "student") {
      return null;
    }

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

    return { code, progress };
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

    await Promise.all([
      studentApi.saveMyCode(user.id, state.userCode),
      studentApi.saveMyProgress(user.id, toPersistedProgressRecord(state)),
    ]);
  },
);
