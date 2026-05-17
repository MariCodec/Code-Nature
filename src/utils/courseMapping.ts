import type { CourseDTO } from "../types/content";
import type { LessonCategory } from "../types/lessonTypes";

export const LEGACY_CATEGORY_TO_COURSE_ID: Record<LessonCategory, string> = {
  html: "course_html_basic",
  css: "course_css_basic",
};

export const COURSE_ID_TO_LEGACY_CATEGORY: Record<string, LessonCategory> = {
  course_html_basic: "html",
  course_css_basic: "css",
};

export const findCourseByLegacyCategory = (
  courses: CourseDTO[],
  category: LessonCategory,
): CourseDTO | null => {
  const courseId = LEGACY_CATEGORY_TO_COURSE_ID[category];
  return courses.find((course) => course.id === courseId) ?? null;
};

export const findLegacyCategoryByCourseId = (
  courseId: string,
): LessonCategory | null => COURSE_ID_TO_LEGACY_CATEGORY[courseId] ?? null;

export const buildStudentLessonPath = (
  courseId: string,
  moduleId: string,
  lessonId: string,
): string => `/student/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`;

export const buildStudentTechCheckPath = (
  courseId: string,
  moduleId: string,
  lessonId: string,
): string => `/student/courses/${courseId}/modules/${moduleId}/tech-checks/${lessonId}`;
