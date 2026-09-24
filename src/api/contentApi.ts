import { lessons as lessonData } from "../data/lessonData";
import {
  fileCatalog,
  getFileCoursesByTrackSlug,
  getFileLesson,
  getFileLessonsForModule,
  getFileModulesForCourse,
} from "../content/fileContent";
import type {
  CourseDTO,
  CourseModuleDTO,
  LessonDTO,
  LessonFileDTO,
  LessonListItemDTO,
  LessonTheoryBlockDTO,
  LessonTaskDTO,
  LessonVideoDTO,
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
  orderIndex: 1,
};

const categoryToCourse: Record<LessonCategory, CourseDTO> = {
  html: {
    id: "course_html_basic",
    trackId: FRONTEND_TRACK_ID,
    slug: "html-basic",
    title: "HTML для початківців",
    description: "Базова HTML-розмітка і структура документа.",
    level: "beginner",
    accessLevel: "free",
    progression: "sequential",
    prerequisiteCourseIds: [],
    isPublished: true,
  },
  css: {
    id: "course_css_basic",
    trackId: FRONTEND_TRACK_ID,
    slug: "css-basic",
    title: "CSS для початківців",
    description: "Основи стилізації елементів та layout-підходів.",
    level: "beginner",
    accessLevel: "free",
    progression: "sequential",
    prerequisiteCourseIds: ["course_html_basic"],
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

/**
 * Міст для вмираючого джерела: старий контент тримає **фрагмент** розмітки,
 * а рушій відтоді нічого від себе не додає (PLATFORM_UA, розділ 5, «Формат
 * документа уроку»). Без обгортки тут ці уроки лишились би і без `<head>`,
 * і головне — **без стилів**: `<link>` у фрагменті ніхто не писав, бо його
 * підставляв рушій.
 *
 * Обгортка живе саме тут, у джерелі даних, а не в рушії: інакше він знову
 * почав би тихо формувати програму курсу. Помре разом із `lessonData.ts`
 * і цим файлом у Фазі 5.
 */
const wrapFragmentAsDocument = (title: string, bodyHtml: string) => `<!DOCTYPE html>
<html lang="uk">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
${bodyHtml}
  </body>
</html>
`;

const mapLessonFiles = (
  lessonId: string,
  title: string,
  initialHtml: string,
  initialCss: string,
): LessonFileDTO[] => [
  {
    id: `${lessonId}_file_html`,
    name: "index.html",
    language: "html",
    initialContent: wrapFragmentAsDocument(title, initialHtml),
    orderIndex: 1,
    isEditable: true,
    isEntry: true,
  },
  {
    id: `${lessonId}_file_css`,
    name: "style.css",
    language: "css",
    initialContent: initialCss,
    orderIndex: 2,
    isEditable: true,
    isEntry: false,
  },
];

const mapLessonVideos = (lessonId: string, title: string): LessonVideoDTO[] => [
  {
    id: `${lessonId}_video_intro`,
    provider: "youtube",
    sourceUrl: "https://www.youtube.com/watch?v=qz0aGYrrlhU",
    assetId: null,
    title: `Відеоурок: ${title}`,
    description: "Тестове YouTube-відео для перевірки відображення перед практикою та в сайдбарі.",
    durationSeconds: 766,
    thumbnailUrl: null,
    transcript: null,
    captionsUrl: null,
    orderIndex: 1,
    isRequired: false,
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
    const files = mapLessonFiles(
      lesson.id,
      lesson.title,
      lesson.initialHtml,
      lesson.initialCss,
    );
    const theoryBlocks = lesson.theory?.blocks.map(mapTheoryBlock) ?? [];
    const tasks: LessonTaskDTO[] = lesson.tasks.map((task, taskIndex) => ({
      id: task.id,
      title: `Завдання ${taskIndex + 1}`,
      description: task.text,
      orderIndex: taskIndex + 1,
      rules: task.rules,
      // Старий формат підказок не має. Порожній масив, а не вигаданий текст:
      // підказки приїдуть із контенту у Фазі 5, коли це джерело помре.
      hints: [],
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
      validationType: "auto",
      orderIndex: lesson.order || index + 1,
      isPublished: true,
      files,
      theoryBlocks,
      videos: mapLessonVideos(lesson.id, lesson.title),
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
  // Позицію техчека визначає `lessonKind`, а не число: домен ставить його в кінець
  // сам (`domain/progression`). Тут просто наступний номер, без магічних 10_000.
  const orderIndex = getLessonsForModule(moduleId).length + 1;

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
      validationType: "auto",
      orderIndex,
      isPublished: true,
      files: mapLessonFiles(
        lessonId,
        "Техчек: HTML Basic",
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
          id: `${lessonId}_q1`,
          title: "Питання 1",
          description: "Який тег позначає видимий головний заголовок сторінки?",
          orderIndex: 1,
          rules: {
            kind: "quiz",
            selectionMode: "single",
            options: [
              { id: "a", text: "<head>" },
              { id: "b", text: "<title>" },
              { id: "c", text: "<h1>" },
              { id: "d", text: "<header>" },
            ],
            correctOptionIds: ["c"],
            explanation:
              "<head> — службова частина документа, її не видно. <title> — назва вкладки браузера. <header> — верхня частина сторінки, але сама по собі не заголовок. Видимий головний заголовок це <h1>.",
            reviewLessonId: "intro",
          },
          hints: [],
        },
        {
          id: `${lessonId}_q2`,
          title: "Питання 2",
          description: "Які з цих тверджень про заголовки правильні?",
          orderIndex: 2,
          rules: {
            kind: "quiz",
            selectionMode: "multiple",
            options: [
              { id: "a", text: "Рівнів заголовків шість: від h1 до h6" },
              { id: "b", text: "Рівень заголовка обирають за потрібним розміром шрифту" },
              { id: "c", text: "h1 на сторінці зазвичай один" },
              { id: "d", text: "Заголовок має бути найпершим тегом у документі" },
            ],
            correctOptionIds: ["a", "c"],
            explanation:
              "Рівень означає важливість у структурі, а не розмір — розмір задається через CSS. h1 на сторінці зазвичай один, як назва розділу в книжці. Першим тегом заголовок бути не зобовʼязаний.",
            reviewLessonId: "intro",
          },
          hints: [],
        },
        {
          id: `${lessonId}_q3`,
          title: "Питання 3",
          description: "Чим є сторінка, яку ти бачиш у браузері?",
          orderIndex: 3,
          rules: {
            kind: "quiz",
            selectionMode: "single",
            options: [
              { id: "a", text: "Картинкою, яку намалював сервер" },
              { id: "b", text: "Текстом із розміткою, який браузер перетворює на зображення" },
              { id: "c", text: "Програмою, скомпільованою під конкретний браузер" },
            ],
            correctOptionIds: ["b"],
            explanation:
              "Сервер надсилає звичайний текст із тегами. Малює сторінку вже браузер — саме тому її можна написати в текстовому редакторі.",
            reviewLessonId: "intro",
          },
          hints: [],
        },
        {
          id: `${lessonId}_practice`,
          title: "Практика",
          description:
            "Збери сторінку, на якій є:\n- заголовок `h1` з текстом `Мій перший техчек`\n- абзац `p` з текстом `Я закріплюю HTML.`\n- заголовок зеленого кольору, заданий через CSS",
          orderIndex: 10,
          rules: {
            kind: "dom",
            selectors: [{ selector: "h1" }, { selector: "p" }],
            textContains: [
              { selector: "h1", text: "Мій перший техчек" },
              { selector: "p", text: "Я закріплюю HTML." },
            ],
            cssChecks: [{ selector: "h1", property: "color", value: "rgb(0, 128, 0)" }],
          },
          hints: [],
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
    validationType: "auto",
    orderIndex,
    isPublished: true,
    files: mapLessonFiles(
      lessonId,
      "Техчек: CSS Basic",
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
        id: `${lessonId}_q1`,
        title: "Питання 1",
        description: "Як записується селектор за класом?",
        orderIndex: 1,
        rules: {
          kind: "quiz",
          selectionMode: "single",
          options: [
            { id: "a", text: "#card" },
            { id: "b", text: ".card" },
            { id: "c", text: "card" },
          ],
          correctOptionIds: ["b"],
          explanation:
            "Крапка — це клас, решітка — ідентифікатор, а без символу — назва тега.",
        },
        hints: [],
      },
      {
        id: `${lessonId}_q2`,
        title: "Питання 2",
        description: "Яка властивість задає внутрішній відступ елемента?",
        orderIndex: 2,
        rules: {
          kind: "quiz",
          selectionMode: "single",
          options: [
            { id: "a", text: "margin" },
            { id: "b", text: "border" },
            { id: "c", text: "padding" },
          ],
          correctOptionIds: ["c"],
          explanation:
            "padding — відступ усередині елемента, між його краєм і вмістом. margin — навпаки, зовні.",
        },
        hints: [],
      },
      {
        id: `${lessonId}_practice`,
        title: "Практика",
        description:
          "Оформи картку через CSS:\n- внутрішній відступ `.card` — 24px\n- колір заголовка `h1` — зелений",
        orderIndex: 10,
        rules: {
          kind: "dom",
          selectors: [{ selector: ".card" }, { selector: "h1" }],
          cssChecks: [
            { selector: ".card", property: "padding", value: "24px" },
            { selector: "h1", property: "color", value: "rgb(0, 128, 0)" },
          ],
        },
        hints: [],
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

/**
 * Два джерела контенту живуть поруч, і файли стоять першими.
 *
 * Фаза 2 відкриває теку `src/content/`; `lessonData.ts` разом із техчеками,
 * покладеними тут інлайном, помирає у Фазі 5 (PLATFORM_UA, розділ 9). Доти в каталозі
 * видно обидва набори курсів — і це краще, ніж тихо сховати один із них: поки старе
 * джерело живе, воно має бути видиме, інакше про нього забудуть разом із його
 * дефектами (порожній курс «CSS для початківців» — розділ 10).
 *
 * Id не перетинаються: файли дають `crs_*` / `lsn_*`, старе джерело — `course_*`
 * / `intro`. Тому «файли першими» тут ще не має жодного ефекту, але порядок
 * записаний зараз, доки перетину немає: коли Фаза 5 почне переносити уроки,
 * саме він вирішить, хто з двох правий.
 */
export const contentApi = {
  async getTracks(): Promise<TrackDTO[]> {
    await delay();
    return [...fileCatalog.tracks, track];
  },

  async getCoursesByTrack(trackSlug: string): Promise<CourseDTO[]> {
    await delay();
    const fromFiles = getFileCoursesByTrackSlug(trackSlug);
    if (trackSlug !== FRONTEND_TRACK_SLUG) return fromFiles;
    return [...fromFiles, ...Object.values(categoryToCourse)];
  },

  async getCourse(courseId: string): Promise<CourseDTO | null> {
    await delay();
    return (
      fileCatalog.courses.find((course) => course.id === courseId) ??
      Object.values(categoryToCourse).find((course) => course.id === courseId) ??
      null
    );
  },

  async getCourseModules(courseId: string): Promise<CourseModuleDTO[]> {
    await delay();
    const fromFiles = getFileModulesForCourse(courseId);
    return fromFiles.length > 0 ? fromFiles : getModulesForCourse(courseId);
  },

  async getModuleLessons(moduleId: string): Promise<LessonListItemDTO[]> {
    await delay();
    const fromFiles = getFileLessonsForModule(moduleId);
    if (fromFiles.length > 0) return fromFiles.map(mapLessonListItem);
    return getModuleContentItems(moduleId).map(mapLessonListItem);
  },

  async getLesson(lessonId: string): Promise<LessonDTO | null> {
    await delay();
    const fromFile = getFileLesson(lessonId);
    if (fromFile) return fromFile;

    const courses = Object.values(categoryToCourse);
    for (const course of courses) {
      const lesson = getLessonsForCourse(course.id).find((item) => item.id === lessonId);
      if (lesson) return lesson;
    }
    return null;
  },
};
