/**
 * Розбір контентних JSON у DTO проєкту.
 *
 * Перший крок циклу розробки контенту (PLATFORM_UA, розділ 8): дірка між уроками
 * й типами прожила цілу фазу непоміченою, бо `tsc` її не бачить — JSON не типізується,
 * поки його ніхто не імпортує.
 *
 * Звʼязок із типами тут не декларативний, а структурний: функції **повертають**
 * `LessonDTO` і `CatalogDTO`, тож варто типу набути поля — і компілятор впаде саме
 * тут, поруч із місцем, де це поле треба прочитати з JSON.
 *
 * Невідомі поля — теж помилка. Саме вони ловлять описку `textContain` замість
 * `textContains`: без цього правило мовчки зникає, а завдання зараховується.
 */

import type {
  CourseDTO,
  CourseModuleDTO,
  LessonDTO,
  LessonFileDTO,
  LessonTaskDTO,
  LessonTheoryBlockDTO,
  LessonVideoDTO,
  TrackDTO,
} from "../types/content";
import type {
  CssRule,
  SelectorRule,
  TaskRules,
  TextRule,
} from "../types/lessonTypes";

export type ContentIssue = { where: string; message: string };

export type CatalogDTO = {
  tracks: TrackDTO[];
  courses: CourseDTO[];
  modules: CourseModuleDTO[];
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Читач одного обʼєкта: повертає значення потрібного типу, а все, що не зійшлося,
 * складає в `issues`. Не кидає — інакше перший же зламаний урок ховав би решту.
 */
function scope(issues: ContentIssue[], where: string, raw: unknown) {
  const data = isObject(raw) ? raw : {};
  if (!isObject(raw)) issues.push({ where, message: "очікувався обʼєкт" });

  const seen = new Set<string>();
  const bad = (key: string, message: string) => {
    issues.push({ where: `${where}.${key}`, message });
  };

  const take = (key: string) => {
    seen.add(key);
    return data[key];
  };

  return {
    str(key: string): string {
      const value = take(key);
      if (typeof value === "string") return value;
      bad(key, `очікувався рядок, а є ${typeof value}`);
      return "";
    },
    strOrNull(key: string): string | null {
      const value = take(key);
      if (typeof value === "string" || value === null) return value;
      bad(key, `очікувався рядок або null, а є ${typeof value}`);
      return null;
    },
    num(key: string): number {
      const value = take(key);
      if (typeof value === "number") return value;
      bad(key, `очікувалось число, а є ${typeof value}`);
      return 0;
    },
    numOrNull(key: string): number | null {
      const value = take(key);
      if (typeof value === "number" || value === null) return value;
      bad(key, `очікувалось число або null, а є ${typeof value}`);
      return null;
    },
    bool(key: string): boolean {
      const value = take(key);
      if (typeof value === "boolean") return value;
      bad(key, `очікувався boolean, а є ${typeof value}`);
      return false;
    },
    oneOf<T extends string>(key: string, allowed: readonly T[]): T {
      const value = take(key);
      if (typeof value === "string" && (allowed as readonly string[]).includes(value))
        return value as T;
      bad(key, `очікувалось одне з [${allowed.join(", ")}], а є ${JSON.stringify(value)}`);
      return allowed[0];
    },
    strings(key: string): string[] {
      const value = take(key);
      if (!Array.isArray(value)) {
        bad(key, `очікувався масив рядків, а є ${typeof value}`);
        return [];
      }
      return value.map((item, index) => {
        if (typeof item === "string") return item;
        bad(`${key}[${index}]`, "очікувався рядок");
        return "";
      });
    },
    list<T>(key: string, parse: (item: unknown, where: string) => T): T[] {
      const value = take(key);
      if (!Array.isArray(value)) {
        bad(key, `очікувався масив, а є ${typeof value}`);
        return [];
      }
      return value.map((item, index) => parse(item, `${where}.${key}[${index}]`));
    },
    raw(key: string): unknown {
      return take(key);
    },
    /** Усе, що лишилось непрочитаним, — помилка. */
    done() {
      for (const key of Object.keys(data)) {
        if (!seen.has(key)) issues.push({ where, message: `невідоме поле "${key}"` });
      }
    },
  };
}

const RUNTIME_TYPES = [
  "html-css-preview",
  "js-dom",
  "code-output",
  "spa-preview",
  "theory-only",
  "video",
] as const;
const VALIDATION_TYPES = ["auto", "manual", "none"] as const;
const LESSON_KINDS = ["lesson", "tech_check"] as const;
const VIDEO_PROVIDERS = ["upload", "youtube", "vimeo", "mux", "external"] as const;

function parseSelectorRule(issues: ContentIssue[], raw: unknown, where: string): SelectorRule {
  const s = scope(issues, where, raw);
  const selector = s.str("selector");
  const minCountRaw = s.raw("minCount");
  const rule: SelectorRule = { selector };
  if (minCountRaw !== undefined) {
    if (typeof minCountRaw === "number") rule.minCount = minCountRaw;
    else issues.push({ where: `${where}.minCount`, message: "очікувалось число" });
  }
  s.done();
  return rule;
}

function parseTextRule(issues: ContentIssue[], raw: unknown, where: string): TextRule {
  const s = scope(issues, where, raw);
  const rule: TextRule = { selector: s.str("selector") };

  const text = s.raw("text");
  if (text !== undefined) {
    if (typeof text === "string") rule.text = text;
    else issues.push({ where: `${where}.text`, message: "очікувався рядок" });
  }

  const minLength = s.raw("minLength");
  if (minLength !== undefined) {
    if (typeof minLength === "number") rule.minLength = minLength;
    else issues.push({ where: `${where}.minLength`, message: "очікувалось число" });
  }

  if (rule.text === undefined && rule.minLength === undefined)
    issues.push({ where, message: "правило без умови: потрібен text або minLength" });

  s.done();
  return rule;
}

function parseCssRule(issues: ContentIssue[], raw: unknown, where: string): CssRule {
  const s = scope(issues, where, raw);
  const rule: CssRule = {
    selector: s.str("selector"),
    property: s.str("property"),
    value: s.str("value"),
  };
  s.done();
  return rule;
}

function parseTaskRules(issues: ContentIssue[], raw: unknown, where: string): TaskRules {
  const kind = isObject(raw) ? raw.kind : undefined;

  if (kind === "quiz") {
    const s = scope(issues, where, raw);
    s.oneOf("kind", ["quiz"] as const);

    const selectionMode = s.raw("selectionMode");
    const rules: TaskRules = {
      kind: "quiz",
      options: s.list("options", (item, itemWhere) => {
        const o = scope(issues, itemWhere, item);
        const option = { id: o.str("id"), text: o.str("text") };
        o.done();
        return option;
      }),
      correctOptionIds: s.strings("correctOptionIds"),
      explanation: s.str("explanation"),
    };

    if (selectionMode !== undefined) {
      if (selectionMode === "single" || selectionMode === "multiple")
        rules.selectionMode = selectionMode;
      else
        issues.push({
          where: `${where}.selectionMode`,
          message: "очікувалось single або multiple",
        });
    }

    const reviewLessonId = s.raw("reviewLessonId");
    if (reviewLessonId !== undefined) {
      if (typeof reviewLessonId === "string") rules.reviewLessonId = reviewLessonId;
      else issues.push({ where: `${where}.reviewLessonId`, message: "очікувався рядок" });
    }

    s.done();
    return rules;
  }

  const s = scope(issues, where, raw);
  s.oneOf("kind", ["dom"] as const);

  const rules: TaskRules = { kind: "dom" };
  if (s.raw("selectors") !== undefined)
    rules.selectors = s.list("selectors", (item, w) => parseSelectorRule(issues, item, w));
  if (s.raw("textContains") !== undefined)
    rules.textContains = s.list("textContains", (item, w) => parseTextRule(issues, item, w));
  if (s.raw("cssChecks") !== undefined)
    rules.cssChecks = s.list("cssChecks", (item, w) => parseCssRule(issues, item, w));

  if (!rules.selectors?.length && !rules.textContains?.length && !rules.cssChecks?.length)
    issues.push({ where, message: "завдання без жодного правила не зараховується ніколи" });

  s.done();
  return rules;
}

function parseTask(issues: ContentIssue[], raw: unknown, where: string): LessonTaskDTO {
  const s = scope(issues, where, raw);
  const task: LessonTaskDTO = {
    id: s.str("id"),
    title: s.str("title"),
    description: s.str("description"),
    orderIndex: s.num("orderIndex"),
    rules: parseTaskRules(issues, s.raw("rules"), `${where}.rules`),
    hints: s.raw("hints") === undefined ? [] : s.strings("hints"),
  };
  s.done();
  return task;
}

function parseFile(issues: ContentIssue[], raw: unknown, where: string): LessonFileDTO {
  const s = scope(issues, where, raw);
  const file: LessonFileDTO = {
    id: s.str("id"),
    name: s.str("name"),
    language: s.str("language"),
    initialContent: s.str("initialContent"),
    orderIndex: s.num("orderIndex"),
    isEditable: s.bool("isEditable"),
  };
  s.done();
  return file;
}

function parseTheoryBlock(
  issues: ContentIssue[],
  raw: unknown,
  where: string,
): LessonTheoryBlockDTO {
  const s = scope(issues, where, raw);
  const id = s.str("id");
  const blockType = s.oneOf("blockType", ["text", "list", "code", "note"] as const);
  const orderIndex = s.num("orderIndex");
  const contentRaw = s.raw("content");
  s.done();

  const c = scope(issues, `${where}.content`, contentRaw);

  switch (blockType) {
    case "text": {
      const block = { id, blockType, content: { text: c.str("text") }, orderIndex } as const;
      c.done();
      return block;
    }
    case "list": {
      const block = { id, blockType, content: { items: c.strings("items") }, orderIndex } as const;
      c.done();
      return block;
    }
    case "code": {
      const block = {
        id,
        blockType,
        content: { lang: c.str("lang"), code: c.str("code") },
        orderIndex,
      } as const;
      c.done();
      return block;
    }
    case "note": {
      const block = {
        id,
        blockType,
        content: { tone: c.oneOf("tone", ["info", "warning"] as const), text: c.str("text") },
        orderIndex,
      } as const;
      c.done();
      return block;
    }
  }
}

function parseVideo(issues: ContentIssue[], raw: unknown, where: string): LessonVideoDTO {
  const s = scope(issues, where, raw);
  const video: LessonVideoDTO = {
    id: s.str("id"),
    provider: s.oneOf("provider", VIDEO_PROVIDERS),
    sourceUrl: s.strOrNull("sourceUrl"),
    assetId: s.strOrNull("assetId"),
    title: s.str("title"),
    description: s.str("description"),
    durationSeconds: s.numOrNull("durationSeconds"),
    thumbnailUrl: s.strOrNull("thumbnailUrl"),
    transcript: s.strOrNull("transcript"),
    captionsUrl: s.strOrNull("captionsUrl"),
    orderIndex: s.num("orderIndex"),
    isRequired: s.bool("isRequired"),
  };
  s.done();
  return video;
}

export function parseLesson(
  raw: unknown,
  where: string,
): { lesson: LessonDTO; issues: ContentIssue[] } {
  const issues: ContentIssue[] = [];
  const s = scope(issues, where, raw);

  const lesson: LessonDTO = {
    id: s.str("id"),
    courseId: s.str("courseId"),
    moduleId: s.str("moduleId"),
    lessonKind: s.oneOf("lessonKind", LESSON_KINDS),
    slug: s.str("slug"),
    title: s.str("title"),
    description: s.str("description"),
    runtimeType: s.oneOf("runtimeType", RUNTIME_TYPES),
    validationType: s.oneOf("validationType", VALIDATION_TYPES),
    orderIndex: s.num("orderIndex"),
    isPublished: s.bool("isPublished"),
    files: s.list("files", (item, w) => parseFile(issues, item, w)),
    theoryBlocks: s.list("theoryBlocks", (item, w) => parseTheoryBlock(issues, item, w)),
    videos: s.list("videos", (item, w) => parseVideo(issues, item, w)),
    tasks: s.list("tasks", (item, w) => parseTask(issues, item, w)),
  };
  s.done();

  // Правило завершення з розділу 3: `auto` без завдань не завершується ніколи,
  // тож такий урок — не «поки без практики», а глухий кут для учня.
  if (lesson.validationType === "auto" && lesson.tasks.length === 0)
    issues.push({ where, message: "validationType: auto, але завдань немає" });

  return { lesson, issues };
}

export function parseCatalog(
  raw: unknown,
  where: string,
): { catalog: CatalogDTO; issues: ContentIssue[] } {
  const issues: ContentIssue[] = [];
  const s = scope(issues, where, raw);

  const catalog: CatalogDTO = {
    tracks: s.list("tracks", (item, w) => {
      const t = scope(issues, w, item);
      const track: TrackDTO = {
        id: t.str("id"),
        slug: t.str("slug"),
        title: t.str("title"),
        description: t.str("description"),
        orderIndex: t.num("orderIndex"),
      };
      t.done();
      return track;
    }),
    courses: s.list("courses", (item, w) => {
      const c = scope(issues, w, item);
      const course: CourseDTO = {
        id: c.str("id"),
        trackId: c.str("trackId"),
        slug: c.str("slug"),
        title: c.str("title"),
        description: c.str("description"),
        level: c.str("level"),
        accessLevel: c.oneOf("accessLevel", ["free", "paid"] as const),
        progression: c.oneOf("progression", ["sequential", "free"] as const),
        prerequisiteCourseIds: c.strings("prerequisiteCourseIds"),
        isPublished: c.bool("isPublished"),
      };
      c.done();
      return course;
    }),
    modules: s.list("modules", (item, w) => {
      const m = scope(issues, w, item);
      const module: CourseModuleDTO = {
        id: m.str("id"),
        courseId: m.str("courseId"),
        slug: m.str("slug"),
        title: m.str("title"),
        description: m.str("description"),
        orderIndex: m.num("orderIndex"),
        isPublished: m.bool("isPublished"),
      };
      m.done();
      return module;
    }),
  };
  s.done();

  return { catalog, issues };
}
