import { useMemo } from "react";
import { useSelector } from "react-redux";

import type { RootState } from "../store";
import {
  selectCourseLessons,
  selectCourseModules,
} from "../store/slices/contentSlice";
import {
  getModuleState,
  type ModuleContext,
  type ModuleState,
} from "../domain/progression";
import type { CourseModuleDTO } from "../types/content";

export type ModuleProgression = {
  ctx: ModuleContext;
  state: ModuleState;
  orderedModules: CourseModuleDTO[];
  nextModule: CourseModuleDTO | null;
};

/**
 * Єдине джерело правди про проходження модуля для UI.
 *
 * Сам стан рахує `domain/progression` — тут лише збирання даних із Redux.
 * Коли у Фазі 6 форма прогресу зміниться, правити доведеться цей файл, а не логіку.
 */
export function useModuleProgression(
  courseId: string | undefined,
  moduleId: string | undefined,
): ModuleProgression {
  const completedLessons = useSelector(
    (state: RootState) => state.progress.completedLessons,
  );
  const courseLessons = useSelector((state: RootState) =>
    courseId ? selectCourseLessons(state, courseId) : [],
  );
  const courseModules = useSelector((state: RootState) =>
    courseId ? selectCourseModules(state, courseId) : [],
  );

  return useMemo(() => {
    const orderedModules = [...courseModules].sort(
      (a, b) => a.orderIndex - b.orderIndex,
    );
    const currentIndex = orderedModules.findIndex((module) => module.id === moduleId);
    const nextModule =
      currentIndex >= 0 ? orderedModules[currentIndex + 1] ?? null : null;

    const ctx: ModuleContext = {
      items: courseLessons.filter((lesson) => lesson.moduleId === moduleId),
      completedIds: new Set(completedLessons),
      nextModuleId: nextModule?.id ?? null,
    };

    return { ctx, state: getModuleState(ctx), orderedModules, nextModule };
  }, [completedLessons, courseLessons, courseModules, moduleId]);
}
