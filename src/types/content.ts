import type { TaskRules } from "./lessonTypes";

export type UserRole = "student" | "teacher";

export type TrackDTO = {
  id: string;
  slug: string;
  title: string;
  description: string;
};

export type CourseDTO = {
  id: string;
  trackId: string;
  slug: string;
  title: string;
  description: string;
  level: string;
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
  | "theory-only"
  | "video";

export type LessonValidationType =
  | "dom-check"
  | "output-check"
  | "manual-check"
  | "none";

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
