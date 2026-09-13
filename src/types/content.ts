import type { TaskRules } from "./lessonTypes";

/** Роль завжди приходить із сервера. Enum повний з першого дня, навіть поки
 * teacher і admin без функціоналу — див. PLATFORM_UA, розділ 2. */
export type UserRole = "student" | "teacher" | "admin";

export type TrackDTO = {
  id: string;
  slug: string;
  title: string;
  description: string;
  orderIndex: number;
};

/** Одиниця доступу: саме тут вирішується платно/безкоштовно і що після чого. */
export type CourseDTO = {
  id: string;
  trackId: string;
  slug: string;
  title: string;
  description: string;
  level: string;
  /** Монетизація відкладена, але поле є з першого дня — розділ 3. */
  accessLevel: "free" | "paid";
  /** Чи можна стрибати між уроками. */
  progression: "sequential" | "free";
  /** CSS після HTML, React після JS. */
  prerequisiteCourseIds: string[];
  isPublished: boolean;
};

export type CourseModuleDTO = {
  id: string;
  courseId: string;
  slug: string;
  title: string;
  description: string;
  orderIndex: number;
  isPublished: boolean;
};

export type LessonRuntimeType =
  | "html-css-preview"
  | "js-dom"
  | "code-output"
  | "spa-preview"
  | "theory-only"
  | "video";

/**
 * Каже *чи* перевіряти, а не *чим*. Чим — каже `TaskRules.kind` у кожному завданні
 * окремо, тож значень рівно три: `dom-check`/`output-check` дублювали б тег правила
 * й розійшлися б із ним на першому ж уроці, де в одному завданні DOM, а в іншому
 * питання. Такий урок — техчек — уже існує. Див. PLATFORM_UA, розділ 3.
 */
export type LessonValidationType = "auto" | "manual" | "none";

export type LessonKind = "lesson" | "tech_check";

export type LessonFileDTO = {
  id: string;
  name: string;
  language: string;
  initialContent: string;
  orderIndex: number;
  isEditable: boolean;
};

export type LessonTheoryBlockDTO =
  | {
      id: string;
      blockType: "text";
      content: { text: string };
      orderIndex: number;
    }
  | {
      id: string;
      blockType: "list";
      content: { items: string[] };
      orderIndex: number;
    }
  | {
      id: string;
      blockType: "code";
      content: { lang: string; code: string };
      orderIndex: number;
    }
  | {
      id: string;
      blockType: "note";
      content: { tone: "info" | "warning"; text: string };
      orderIndex: number;
    };

export type LessonTaskDTO = {
  id: string;
  title: string;
  description: string;
  orderIndex: number;
  rules: TaskRules;
  /** 2–3 підказки, що розкриваються поступово. У самостійному режимі це заміна
   * викладача, а не додаткова зручність — розділ 3. Порожній масив, якщо їх немає. */
  hints: string[];
};

export type LessonVideoProvider =
  | "upload"
  | "youtube"
  | "vimeo"
  | "mux"
  | "external";

export type LessonVideoDTO = {
  id: string;
  provider: LessonVideoProvider;
  sourceUrl: string | null;
  assetId: string | null;
  title: string;
  description: string;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
  transcript: string | null;
  captionsUrl: string | null;
  orderIndex: number;
  isRequired: boolean;
};

export type LessonListItemDTO = {
  id: string;
  courseId: string;
  moduleId: string;
  lessonKind: LessonKind;
  slug: string;
  title: string;
  description: string;
  runtimeType: LessonRuntimeType;
  validationType: LessonValidationType;
  orderIndex: number;
  isPublished: boolean;
};

export type LessonDTO = LessonListItemDTO & {
  files: LessonFileDTO[];
  theoryBlocks: LessonTheoryBlockDTO[];
  videos: LessonVideoDTO[];
  tasks: LessonTaskDTO[];
};

export type StudentSavedFileDTO = {
  name: string;
  language: string;
  content: string;
};

export type StudentCodeDTO = {
  lessonId: string;
  courseId: string;
  savedFiles: StudentSavedFileDTO[];
  updatedAt: string;
};

export type StudentLessonProgressDTO = {
  lessonId: string;
  courseId: string;
  status: "not_started" | "in_progress" | "completed";
  startedAt: string | null;
  completedAt: string | null;
  updatedAt: string;
};

export type StudentTaskProgressDTO = {
  lessonId: string;
  taskId: string;
  courseId: string;
  isCompleted: boolean;
  completedAt: string | null;
  updatedAt: string;
};

export type StudentVideoProgressDTO = {
  lessonId: string;
  courseId: string;
  isWatched: boolean;
  watchedAt: string | null;
  updatedAt: string;
};

export type TeacherStudentListItemDTO = {
  id: string;
  name: string;
  email: string;
  completedLessonsCount: number;
  currentLessonId: string | null;
  lastActivityAt: string | null;
};

export type TeacherStudentCodeSnapshotDTO = {
  lessonId: string;
  savedFiles: StudentSavedFileDTO[];
  updatedAt: string | null;
};

export type TeacherStudentDetailsDTO = {
  id: string;
  name: string;
  email: string;
  currentLessonId: string | null;
  completedLessonsCount: number;
  lastActivityAt: string | null;
  lessonProgress: StudentLessonProgressDTO[];
  taskProgress: StudentTaskProgressDTO[];
  codeSnapshots: TeacherStudentCodeSnapshotDTO[];
};
