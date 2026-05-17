import { lessons as lessonData } from "../data/lessonData";
import type {
  CourseDTO,
  CourseModuleDTO,
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

const categoryToModule: Record<LessonCategory, CourseModuleDTO> = {
  html: {
    id: "module_html_basic",
    courseId: "course_html_basic",
    slug: "html-basic",
    title: "HTML Basic",
    description: "Структура HTML-документа, базові теги та семантика.",
    orderIndex: 1,
    isPublished: true,
  },
  css: {
    id: "module_css_basic",
    courseId: "course_css_basic",
    slug: "css-basic",
    title: "CSS Basic",
    description: "Селектори, базові властивості й перші layout-прийоми.",
    orderIndex: 1,
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

const mapLessonListItem = (lesson: LessonDTO): LessonListItemDTO => ({
  id: lesson.id,
  courseId: lesson.courseId,
  moduleId: lesson.moduleId,
  lessonKind: lesson.lessonKind,
  slug: lesson.slug,
  title: lesson.title,
  description: lesson.description,
  runtimeType: lesson.runtimeType,
  validationType: lesson.validationType,
  orderIndex: lesson.orderIndex,
  isPublished: lesson.isPublished,
});

const getCategoryByCourseId = (courseId: string): LessonCategory | null =>
  (Object.keys(categoryToCourse) as LessonCategory[]).find(
    (key) => categoryToCourse[key].id === courseId,
  ) ?? null;

const getCategoryByModuleId = (moduleId: string): LessonCategory | null =>
  (Object.keys(categoryToModule) as LessonCategory[]).find(
    (key) => categoryToModule[key].id === moduleId,
  ) ?? null;

const getLessonsForModule = (moduleId: string): LessonDTO[] => {
  const category = getCategoryByModuleId(moduleId);
  if (!category) return [];

  const courseId = categoryToCourse[category].id;

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
      moduleId,
      lessonKind: "lesson",
      slug: lesson.id,
      title: lesson.title,
      description: lesson.description,
      runtimeType: "html-css-preview",
      validationType: "dom-check",
      orderIndex: lesson.order || index + 1,
      isPublished: true,
      files,
      theoryBlocks,
      videos: [],
      tasks,
    };
  });
};

const getTechCheckForModule = (moduleId: string): LessonDTO | null => {
  const category = getCategoryByModuleId(moduleId);
  if (!category) return null;

  const courseId = categoryToCourse[category].id;
  const module = categoryToModule[category];
  const lessonId = `techcheck_${module.slug}`;

  if (category === "html") {
    return {
      id: lessonId,
      courseId,
      moduleId,
      lessonKind: "tech_check",
      slug: lessonId,
      title: "Техчек: HTML Basic",
      description: "Закріпи структуру HTML-документа, заголовок, текст і базову стилізацію.",
      runtimeType: "html-css-preview",
      validationType: "dom-check",
      orderIndex: 10_000,
      isPublished: true,
      files: mapLessonFiles(
        lessonId,
        `<main>\n  <h1>Мій перший техчек</h1>\n  <p>Я закріплюю HTML.</p>\n</main>`,
        `h1 {\n  color: red;\n}`,
      ),
      theoryBlocks: [
        {
          id: `${lessonId}_theory_1`,
          blockType: "note",
          content: {
            tone: "info",
            text: "Техчек перевіряє, чи можеш ти самостійно зібрати невеликий HTML-фрагмент за вимогами.",
          },
          orderIndex: 1,
        },
      ],
      videos: [],
      tasks: [
        {
          id: `${lessonId}_task_1`,
          title: "Заголовок",
          description: "Додай на сторінку заголовок h1 з текстом `Мій перший техчек`.",
          orderIndex: 1,
          rules: {
            htmlSelectors: [{ selector: "h1" }],
            requireTextContains: [{ selector: "h1", text: "Мій перший техчек" }],
          },
        },
        {
          id: `${lessonId}_task_2`,
          title: "Абзац",
          description: "Додай абзац p з текстом `Я закріплюю HTML.`.",
          orderIndex: 2,
          rules: {
            htmlSelectors: [{ selector: "p" }],
            requireTextContains: [{ selector: "p", text: "Я закріплюю HTML." }],
          },
        },
        {
          id: `${lessonId}_task_3`,
          title: "Колір",
          description: "Зроби заголовок зеленим через CSS.",
          orderIndex: 3,
          rules: {
            htmlSelectors: [{ selector: "h1" }],
            cssChecks: [
              { selector: "h1", property: "color", value: "rgb(0, 128, 0)" },
            ],
          },
        },
      ],
    };
  }

  return {
    id: lessonId,
    courseId,
    moduleId,
    lessonKind: "tech_check",
    slug: lessonId,
    title: "Техчек: CSS Basic",
    description: "Перевір базову стилізацію елементів: колір, фон і відступи.",
    runtimeType: "html-css-preview",
    validationType: "dom-check",
    orderIndex: 10_000,
    isPublished: true,
    files: mapLessonFiles(
      lessonId,
      `<section class="card">\n  <h1>CSS техчек</h1>\n  <p>Стилізую блок.</p>\n</section>`,
      `.card {\n  padding: 8px;\n}\n\nh1 {\n  color: red;\n}`,
    ),
    theoryBlocks: [
      {
        id: `${lessonId}_theory_1`,
        blockType: "note",
        content: {
          tone: "info",
          text: "Техчек перевіряє, чи можеш ти застосувати CSS-властивості до готової HTML-структури.",
        },
        orderIndex: 1,
      },
    ],
    videos: [],
    tasks: [
      {
        id: `${lessonId}_task_1`,
        title: "Блок",
        description: "Переконайся, що на сторінці є елемент з класом `.card`.",
        orderIndex: 1,
        rules: {
          htmlSelectors: [{ selector: ".card" }],
        },
      },
      {
        id: `${lessonId}_task_2`,
        title: "Відступ",
        description: "Задай `.card` внутрішній відступ 24px.",
        orderIndex: 2,
        rules: {
          htmlSelectors: [{ selector: ".card" }],
          cssChecks: [{ selector: ".card", property: "padding", value: "24px" }],
        },
      },
      {
        id: `${lessonId}_task_3`,
        title: "Колір заголовка",
        description: "Зроби h1 зеленим.",
        orderIndex: 3,
        rules: {
          htmlSelectors: [{ selector: "h1" }],
          cssChecks: [
            { selector: "h1", property: "color", value: "rgb(0, 128, 0)" },
          ],
        },
      },
    ],
  };
};

const getModuleContentItems = (moduleId: string): LessonDTO[] => {
  const techCheck = getTechCheckForModule(moduleId);
  return [...getLessonsForModule(moduleId), ...(techCheck ? [techCheck] : [])];
};

const getModulesForCourse = (courseId: string): CourseModuleDTO[] => {
  const category = getCategoryByCourseId(courseId);
  return category ? [categoryToModule[category]] : [];
};

const getLessonsForCourse = (courseId: string): LessonDTO[] => {
  const category = getCategoryByCourseId(courseId);
  if (!category) return [];

  return getModuleContentItems(categoryToModule[category].id);
};

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

  async getCourseModules(courseId: string): Promise<CourseModuleDTO[]> {
    await delay();
    return getModulesForCourse(courseId);
  },

  async getModuleLessons(moduleId: string): Promise<LessonListItemDTO[]> {
    await delay();
    return getModuleContentItems(moduleId).map(mapLessonListItem);
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
