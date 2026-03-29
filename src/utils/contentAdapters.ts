import type { CourseDTO, LessonDTO, LessonFileDTO, LessonTheoryBlockDTO } from "../types/content";
import type { LessonCategory, LessonContent, LessonTheory, TheoryBlock } from "../types/lessonTypes";

export const LEGACY_CATEGORY_TO_COURSE_SLUG: Record<LessonCategory, string> = {
  html: "html-basic",
  css: "css-basic",
};

export const LEGACY_CATEGORY_TO_COURSE_ID: Record<LessonCategory, string> = {
  html: "course_html_basic",
  css: "course_css_basic",
};

export const getInitialHtmlFromLessonFiles = (files: LessonFileDTO[]): string =>
  files.find((file) => file.name === "index.html")?.initialContent ?? "";

export const getInitialCssFromLessonFiles = (files: LessonFileDTO[]): string =>
  files.find((file) => file.name === "style.css")?.initialContent ?? "";

const mapTheoryBlockToLegacy = (block: LessonTheoryBlockDTO): TheoryBlock => {
  switch (block.blockType) {
    case "text":
      return { type: "text", content: block.content.text };
    case "list":
      return { type: "list", items: block.content.items };
    case "code":
      return {
        type: "code",
        lang: block.content.lang === "css" ? "css" : "html",
        content: block.content.code,
      };
    case "note":
      return {
        type: "note",
        tone: block.content.tone,
        content: block.content.text,
      };
  }
};

export const adaptLessonToLegacyContent = (
  lesson: LessonDTO,
  category: LessonCategory,
): LessonContent => {
  const theory: LessonTheory | undefined = lesson.theoryBlocks.length
    ? {
        blocks: lesson.theoryBlocks.map(mapTheoryBlockToLegacy),
      }
    : undefined;

  return {
    id: lesson.id,
    category,
    order: lesson.orderIndex,
    version: 1,
    title: lesson.title,
    description: lesson.description,
    initialHtml: getInitialHtmlFromLessonFiles(lesson.files),
    initialCss: getInitialCssFromLessonFiles(lesson.files),
    theory,
    tasks: lesson.tasks.map((task) => ({
      id: task.id,
      text: task.description,
      rules: task.rules,
    })),
  };
};

export const findCourseByLegacyCategory = (
  courses: CourseDTO[],
  category: LessonCategory,
): CourseDTO | null => {
  const courseId = LEGACY_CATEGORY_TO_COURSE_ID[category];
  return courses.find((course) => course.id === courseId) ?? null;
};
