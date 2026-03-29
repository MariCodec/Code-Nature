import { lessons as lessonData } from "../data/lessonData";
import type {
  CourseDTO,
  LessonDTO,
  LessonFileDTO,
  LessonListItemDTO,
  LessonTheoryBlockDTO,
  LessonTaskDTO,
  TrackDTO,
} from "../types/content";
import type { LessonCategory, TheoryBlock } from "../types/lessonTypes";

const FRONTEND_TRACK_ID = "track_frontend";
const FRONTEND_TRACK_SLUG = "frontend";

const delay = (ms = 120) => new Promise((resolve) => window.setTimeout(resolve, ms));

const track: TrackDTO = {
  id: FRONTEND_TRACK_ID,
  slug: FRONTEND_TRACK_SLUG,
  title: "Frontend",
  description: "Базові курси для вивчення HTML, CSS та майбутніх frontend напрямів.",
};

const categoryToCourse: Record<LessonCategory, CourseDTO> = {
  html: {
    id: "course_html_basic",
    trackId: FRONTEND_TRACK_ID,
    slug: "html-basic",
    title: "HTML для початківців",
    description: "Базова HTML-розмітка і структура документа.",
    level: "beginner",
    isPublished: true,
  },
  css: {
    id: "course_css_basic",
    trackId: FRONTEND_TRACK_ID,
    slug: "css-basic",
    title: "CSS для початківців",
    description: "Основи стилізації елементів та layout-підходів.",
    level: "beginner",
    isPublished: true,
  },
};

const mapTheoryBlock = (block: TheoryBlock, index: number): LessonTheoryBlockDTO => {
  const id = `theory_${index + 1}`;

  switch (block.type) {
    case "text":
      return { id, blockType: "text", content: { text: block.content }, orderIndex: index + 1 };
    case "list":
      return { id, blockType: "list", content: { items: block.items }, orderIndex: index + 1 };
    case "code":
      return {
        id,
        blockType: "code",
        content: { lang: block.lang, code: block.content },
        orderIndex: index + 1,
      };
    case "note":
      return {
        id,
        blockType: "note",
        content: { tone: block.tone, text: block.content },
        orderIndex: index + 1,
      };
  }
};

const mapLessonFiles = (lessonId: string, initialHtml: string, initialCss: string): LessonFileDTO[] => [
  {
    id: `${lessonId}_file_html`,
    name: "index.html",
    language: "html",
    initialContent: initialHtml,
    orderIndex: 1,
    isEditable: true,
  },
  {
    id: `${lessonId}_file_css`,
    name: "style.css",
    language: "css",
    initialContent: initialCss,
    orderIndex: 2,
    isEditable: true,
  },
];

const getLessonsForCourse = (courseId: string): LessonDTO[] => {
  const category = (Object.keys(categoryToCourse) as LessonCategory[]).find(
    (key) => categoryToCourse[key].id === courseId,
  );

  if (!category) return [];

  return lessonData[category].map((lesson, index) => {
    const files = mapLessonFiles(lesson.id, lesson.initialHtml, lesson.initialCss);
    const theoryBlocks = lesson.theory?.blocks.map(mapTheoryBlock) ?? [];
    const tasks: LessonTaskDTO[] = lesson.tasks.map((task, taskIndex) => ({
      id: task.id,
      title: `Завдання ${taskIndex + 1}`,
      description: task.text,
      orderIndex: taskIndex + 1,
      rules: task.rules,
    }));

    return {
      id: lesson.id,
      courseId,
      slug: lesson.id,
      title: lesson.title,
      description: lesson.description,
      runtimeType: "html-css-preview",
      validationType: "dom-check",
      orderIndex: lesson.order || index + 1,
      isPublished: true,
      files,
      theoryBlocks,
      tasks,
    };
  });
};

const getLessonListItems = (courseId: string): LessonListItemDTO[] =>
  getLessonsForCourse(courseId).map((lesson) => ({
    id: lesson.id,
    courseId: lesson.courseId,
    slug: lesson.slug,
    title: lesson.title,
    description: lesson.description,
    runtimeType: lesson.runtimeType,
    validationType: lesson.validationType,
    orderIndex: lesson.orderIndex,
    isPublished: lesson.isPublished,
  }));

export const contentApi = {
  async getTracks(): Promise<TrackDTO[]> {
    await delay();
    return [track];
  },

  async getCoursesByTrack(trackSlug: string): Promise<CourseDTO[]> {
    await delay();
    if (trackSlug !== FRONTEND_TRACK_SLUG) return [];
    return Object.values(categoryToCourse);
  },

  async getCourse(courseId: string): Promise<CourseDTO | null> {
    await delay();
    return Object.values(categoryToCourse).find((course) => course.id === courseId) ?? null;
  },

  async getCourseLessons(courseId: string): Promise<LessonListItemDTO[]> {
    await delay();
    return getLessonListItems(courseId);
  },

  async getLesson(lessonId: string): Promise<LessonDTO | null> {
    await delay();
    const courses = Object.values(categoryToCourse);
    for (const course of courses) {
      const lesson = getLessonsForCourse(course.id).find((item) => item.id === lessonId);
      if (lesson) return lesson;
    }
    return null;
  },
};
