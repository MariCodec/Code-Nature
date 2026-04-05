import type { CourseDTO } from "../types/content";
import type { LessonCategory } from "../types/lessonTypes";

export const LEGACY_CATEGORY_TO_COURSE_ID: Record<LessonCategory, string> = {
  html: "course_html_basic",
  css: "course_css_basic",
};

export const findCourseByLegacyCategory = (
  courses: CourseDTO[],
  category: LessonCategory,
): CourseDTO | null => {
  const courseId = LEGACY_CATEGORY_TO_COURSE_ID[category];
  return courses.find((course) => course.id === courseId) ?? null;
};
