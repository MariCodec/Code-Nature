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
  LessonAssetDTO,
  LessonDTO,
  LessonFileDTO,
  LessonTaskDTO,
  LessonTheoryBlockDTO,
  LessonVideoDTO,
  TrackDTO,
} from "../types/content";
import type {
  CssRule,
  DocumentRule,
  DomAction,
  QuizTaskRules,
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

/**
 * Правила про структуру самого документа.
 *
 * Контенту вони відкрились у Фазі 3 — разом із тим, що entry-файл став **цілим**
 * документом. Доти рушій підставляв власні `<!doctype>` і `<html lang>`, тож такі
 * правила бачили б обгортку й зараховувались би на порожньому файлі. Обидві
 * половини й мусили приїхати разом; розтяжка в `content.test.ts` тримала це
 * до Фази 3 і знята саме тут.
 */
function parseDocumentRule(issues: ContentIssue[], raw: unknown, where: string): DocumentRule {
  const s = scope(issues, where, raw);
  const rule: DocumentRule = {};

  const hasDoctype = s.raw("hasDoctype");
  if (hasDoctype !== undefined) {
    if (typeof hasDoctype === "boolean") rule.hasDoctype = hasDoctype;
    else issues.push({ where: `${where}.hasDoctype`, message: "очікувався boolean" });
  }

  for (const key of ["lang", "title", "charset"] as const) {
    const value = s.raw(key);
    if (value === undefined) continue;
    if (typeof value === "string") rule[key] = value;
    else issues.push({ where: `${where}.${key}`, message: "очікувався рядок" });
  }

  // `hasDoctype: false` — це «не перевіряти», тож правило з нього одного порожнє.
  if (rule.hasDoctype !== true && rule.lang === undefined && rule.title === undefined &&
      rule.charset === undefined)
    issues.push({ where, message: "правило про документ без жодної умови" });

  s.done();
  return rule;
}

/**
 * Дія перед перевіркою. Видів поки один, але тег обовʼязковий: без нього
 * другий вид довелось би вгадувати за формою полів — та сама помилка,
 * якої ми не робимо в `TaskRules`.
 */
function parseDomAction(issues: ContentIssue[], raw: unknown, where: string): DomAction {
  const s = scope(issues, where, raw);
  const kind = s.oneOf("kind", ["click", "type"] as const);
  const selector = s.str("selector");
  // `text` обовʼязковий саме для `type`: ввести «нічого» — це не дія,
  // а опечатка автора, і мовчки вона дала б непрохідне завдання.
  const action: DomAction =
    kind === "type" ? { kind, selector, text: s.str("text") } : { kind, selector };
  s.done();
  return action;
}

/**
 * Чи питання взагалі можна розвʼязати.
 *
 * Форма правил тут бездоганна — помилка у **звʼязку** між полями, і тому
 * її не бачить ні `tsc`, ні перевірка типів: `correctOptionIds` це просто
 * масив рядків, і вказати ним на варіант, якого немає, синтаксично законно.
 *
 * Ціна найвища з можливих: техчек — це **ворота**. Питання, яке не зараховується
 * ніколи, замикає модуль назавжди, а учень бачить лише «спробуй ще» і не має
 * у кого спитати. Виміряно чотирма пробами перед Фазою 4 — усі чотири пройшли
 * схема-перевірку з нулем зауважень.
 */
function checkQuizSolvable(
  issues: ContentIssue[],
  rules: QuizTaskRules,
  where: string,
): void {
  const optionIds = new Set(rules.options.map((option) => option.id));

  if (optionIds.size !== rules.options.length)
    issues.push({
      where: `${where}.options`,
      message: "два варіанти з однаковим id — незрозуміло, на який вказує correctOptionIds",
    });

  if (rules.correctOptionIds.length === 0)
    issues.push({
      where: `${where}.correctOptionIds`,
      message: "питання без правильної відповіді не зараховується ніколи",
    });

  for (const id of rules.correctOptionIds) {
    if (optionIds.has(id)) continue;
    issues.push({
      where: `${where}.correctOptionIds`,
      message: `вказує на варіант "${id}", якого немає серед options`,
    });
  }

  // `single` малює radio, тобто обрати можна **один** варіант, а зараховується
  // лише повний збіг (`domain/techCheck.checkQuizAnswer`). Два правильні
  // в цьому режимі — питання, яке не закриває ніхто.
  if (rules.selectionMode === "single" && rules.correctOptionIds.length > 1)
    issues.push({
      where,
      message:
        "selectionMode: single, але правильних варіантів кілька — обрати всі неможливо",
    });
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

    checkQuizSolvable(issues, rules, where);

    s.done();
    return rules;
  }

  const s = scope(issues, where, raw);
  s.oneOf("kind", ["dom"] as const);

  const rules: TaskRules = { kind: "dom" };
  if (s.raw("act") !== undefined)
    rules.act = s.list("act", (item, w) => parseDomAction(issues, item, w));
  if (s.raw("document") !== undefined)
    rules.document = parseDocumentRule(issues, s.raw("document"), `${where}.document`);
  if (s.raw("selectors") !== undefined)
    rules.selectors = s.list("selectors", (item, w) => parseSelectorRule(issues, item, w));
  if (s.raw("textContains") !== undefined)
    rules.textContains = s.list("textContains", (item, w) => parseTextRule(issues, item, w));
  if (s.raw("cssChecks") !== undefined)
    rules.cssChecks = s.list("cssChecks", (item, w) => parseCssRule(issues, item, w));

  if (
    !rules.document &&
    !rules.selectors?.length &&
    !rules.textContains?.length &&
    !rules.cssChecks?.length
  )
    // `act` сюди не рахується навмисно: дія — це підготовка, а не умова.
    // Завдання з самими діями зараховувалось би на порожній множині умов,
    // тобто завжди — та сама помилка, що з уроком без завдань.
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
    explanation: s.raw("explanation") === undefined ? "" : s.str("explanation"),
  };

  /**
   * Пояснення необовʼязкове взагалі, але обовʼязкове для **питання**, і перевірка
   * стоїть тут, а не в типі: поле живе на завданні, а вимога — лише до одного
   * виду правил. Доки `explanation` лежало всередині `QuizTaskRules`, цю вимогу
   * тримав парсер правил; переїзд не має її мовчки знімати.
   *
   * Ціна пропуску найвища з можливих: техчек — це ворота, а пояснення там
   * заміна викладача. Без нього учень бачить саме «неправильно» й тицяє навмання.
   */
  if (task.rules.kind === "quiz" && task.explanation.trim() === "")
    issues.push({
      where: `${where}.explanation`,
      message: "питання без пояснення: учень побачить «неправильно» і не дізнається чому",
    });

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
    isEntry: s.bool("isEntry"),
  };
  s.done();
  return file;
}

/**
 * Головний файл уроку має бути рівно один, і він має бути html.
 *
 * Мовчазна помилка найдорожчого сорту: без entry пісочниця показує порожню
 * сторінку, з двома — беззмістовно «перший у масиві». Учень у обох випадках
 * бачить не свій урок і шукає помилку в себе.
 */
function checkEntryFile(issues: ContentIssue[], files: LessonFileDTO[], where: string) {
  const htmlFiles = files.filter((file) => file.language === "html");
  const entries = files.filter((file) => file.isEntry);

  for (const entry of entries) {
    if (entry.language !== "html")
      issues.push({
        where: `${where}.files`,
        message: `isEntry стоїть на файлі «${entry.name}» мови ${entry.language}, а головним може бути лише html`,
      });
  }

  if (htmlFiles.length === 0) {
    if (entries.length > 0)
      issues.push({ where: `${where}.files`, message: "isEntry є, а html-файлів немає" });
    return;
  }

  if (entries.length === 0)
    issues.push({
      where: `${where}.files`,
      message: "жоден файл не позначений isEntry — невідомо, що вантажити першим",
    });

  if (entries.length > 1)
    issues.push({
      where: `${where}.files`,
      message: `головних файлів має бути один, а isEntry стоїть у ${entries.length}`,
    });
}

function parseAsset(issues: ContentIssue[], raw: unknown, where: string): LessonAssetDTO {
  const s = scope(issues, where, raw);
  const asset: LessonAssetDTO = { name: s.str("name"), url: s.str("url") };
  s.done();
  return asset;
}

/** Відносні посилання `<img src>` у тексті entry-файлу. */
const findImageSources = (html: string): string[] => {
  const sources: string[] = [];

  for (const [tag] of html.matchAll(/<img\b[^>]*>/gi)) {
    const src = /\bsrc\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1];
    if (src) sources.push(src.replace(/^\.\//, ""));
  }

  return sources;
};

/**
 * Картинка, яка веде в нікуди.
 *
 * У пісочниці немає файлової системи, тож `<img src="beans.svg">` працює **лише**
 * через підстановку за імʼям ассета. Забув оголосити ассет — і учень бачить
 * порожню рамку замість картинки, а урок про зображення втрачає сенс.
 *
 * Та сама помилка з другого боку: ассет оголошений, але в розмітці на нього
 * ніхто не дивиться. Це вже не поломка, лише зайвий рядок, тож мовчимо —
 * у CSS ассет може використовуватись через `url()`, якого тут не видно.
 */
function checkAssetReferences(
  issues: ContentIssue[],
  files: LessonFileDTO[],
  assets: LessonAssetDTO[],
  where: string,
): void {
  const names = new Set<string>();
  for (const asset of assets) {
    if (names.has(asset.name))
      issues.push({
        where: `${where}.assets`,
        message: `два ассети з імʼям «${asset.name}» — підстановка не знатиме, який брати`,
      });
    names.add(asset.name);
  }

  const entry = files.find((file) => file.isEntry);
  if (!entry) return;

  for (const src of findImageSources(entry.initialContent)) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(src) || src.startsWith("//")) continue;
    if (names.has(src)) continue;
    issues.push({
      where: `${where}.assets`,
      message: `${entry.name} показує «${src}», а такого ассета в уроці немає — картинка веде в нікуди`,
    });
  }
}

/**
 * Посилання на таблиці стилів у тексті entry-файлу.
 *
 * Регулярка, а не `DOMParser`, і це свідомо: схема-перевірка працює і в тестах
 * під Node, де DOM-у немає взагалі. Ціна прийнятна саме тут — помилка цієї
 * перевірки **гучна** (автор бачить повідомлення й перевіряє сам), на відміну
 * від підстановки в пісочниці, яка мусить бути точною й тому розбирає DOM.
 */
const findStylesheetHrefs = (html: string): string[] => {
  const hrefs: string[] = [];

  for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
    if (!/\brel\s*=\s*["'][^"']*\bstylesheet\b/i.test(tag)) continue;

    const href = /\bhref\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1];
    if (href) hrefs.push(href.replace(/^\.\//, ""));
  }

  return hrefs;
};

/**
 * Css-файл, на який ніхто не посилається, мовчки нічого не дає.
 *
 * Рушій більше не інжектить стилі від себе (розділ 5, «Формат документа уроку»):
 * файл потрапляє на сторінку **лише** через `<link rel="stylesheet">` в entry.
 * Забув посилання — і CSS-урок виглядає зламаним для всіх: учень пише правильні
 * стилі, сторінка не міняється, `cssChecks` не зараховується, і винним здається він.
 *
 * Зворотний бік теж помилка автора: `<link>` є, а такого файлу в уроці немає.
 * Для учня це білий екран без жодної підказки.
 */
function checkStylesheetLinks(
  issues: ContentIssue[],
  files: LessonFileDTO[],
  where: string,
): void {
  const entry = files.find((file) => file.isEntry);
  if (!entry) return;

  /**
   * Редагований entry перевіряється лише «зайвим посиланням», але не відсутнім.
   *
   * Знахідка `/code-review`: урок «підключи таблицю стилів» за побудовою
   * починається **без** `<link>` — його пише учень, і це рівно та задача.
   * Вимагати посилання в заготовці означало б заборонити урок, який розділ 5
   * прямо описує (випадок з одруком `styl.css` — це учень редагує href).
   *
   * Там, де entry заблокований, такого уроку бути не може: його пише автор,
   * і забуте посилання — його помилка.
   */
  const studentWritesEntry = entry.isEditable;

  const hrefs = new Set(findStylesheetHrefs(entry.initialContent));
  const cssNames = new Set(
    files.filter((file) => file.language === "css").map((file) => file.name),
  );

  for (const name of cssNames) {
    if (studentWritesEntry || hrefs.has(name)) continue;
    issues.push({
      where: `${where}.files`,
      message: `на css-файл «${name}» немає <link rel="stylesheet"> у ${entry.name} — стилі не потраплять на сторінку`,
    });
  }

  for (const href of hrefs) {
    // Зовнішні посилання ведуть у справжній інтернет — це не наш файл.
    if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("//")) continue;
    if (cssNames.has(href)) continue;
    issues.push({
      where: `${where}.files`,
      message: `${entry.name} посилається на «${href}», а такого css-файлу в уроці немає`,
    });
  }
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
    assets:
      s.raw("assets") === undefined
        ? []
        : s.list("assets", (item, w) => parseAsset(issues, item, w)),
    theoryBlocks: s.list("theoryBlocks", (item, w) => parseTheoryBlock(issues, item, w)),
    videos: s.list("videos", (item, w) => parseVideo(issues, item, w)),
    tasks: s.list("tasks", (item, w) => parseTask(issues, item, w)),
  };
  s.done();

  checkEntryFile(issues, lesson.files, where);
  checkStylesheetLinks(issues, lesson.files, where);
  checkAssetReferences(issues, lesson.files, lesson.assets, where);

  // Правило завершення з розділу 3: `auto` без завдань не завершується ніколи,
  // тож такий урок — не «поки без практики», а глухий кут для учня.
  if (lesson.validationType === "auto" && lesson.tasks.length === 0)
    issues.push({ where, message: "validationType: auto, але завдань немає" });

  return { lesson, issues };
}

/**
 * Посилання **між** уроками. Єдина перевірка, яку неможливо зробити під час
 * розбору одного файлу: `reviewLessonId` веде в інший урок, а розбір бачить
 * лише той, що в руках.
 *
 * Ламається вона тихо й у найгіршому місці: учень відповів неправильно в техчеку,
 * натиснув «повернутись до уроку» — і потрапив у «Урок не знайдено». Це той
 * момент, коли він і так розгублений, бо щойно помилився.
 *
 * Найчастіша причина — перейменування: урок дістав новий id, а посилання
 * лишилось зі старим. `tsc` цього не бачить, бо обидва рядки.
 */
export function checkLessonReferences(lessons: LessonDTO[]): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const knownIds = new Set(lessons.map((lesson) => lesson.id));

  for (const lesson of lessons) {
    for (const task of lesson.tasks) {
      if (task.rules.kind !== "quiz") continue;

      const target = task.rules.reviewLessonId;
      if (target === undefined) continue;

      const where = `${lesson.id}.${task.id}.rules.reviewLessonId`;

      if (!knownIds.has(target))
        issues.push({ where, message: `уроку "${target}" не існує` });
      else if (target === lesson.id)
        issues.push({ where, message: "урок відсилає сам на себе" });
    }
  }

  return issues;
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
