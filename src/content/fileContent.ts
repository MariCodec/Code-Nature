/**
 * Контент із теки `src/content/` як джерело для застосунку.
 *
 * Другий крок циклу розробки контенту (PLATFORM_UA, розділ 8): урок відкривається
 * в застосунку **без деплою** — дописав JSON, перезавантажив сторінку, побачив урок.
 * Без цього контент пишеться наосліп, а половина помилок видно лише в рендері.
 *
 * Тека `lessons/` читається **цілком**, а не переліком файлів. Той самий вибір, що й у
 * `content.test.ts`: новий урок потрапляє і в застосунок, і під схема-перевірку сам,
 * без правки жодного з цих двох файлів. Перелік розійшовся б із текою першим же уроком,
 * який хтось додав і забув вписати.
 *
 * Каталог — навпаки, рівно один файл із відомим імʼям: `tracks`/`courses`/`modules`
 * лежать в одному обʼєкті, і другий такий файл означав би два каталоги, а не більший.
 *
 * Розбір той самий, що й у тесті, — `parseContent`. Другого завантажувача немає
 * навмисно: два розбори того самого JSON розійшлися б, і саме та розбіжність
 * була б невидимою, бо обидва лишались би зеленими.
 */

import type { LessonDTO } from "../types/content";
import {
  checkLessonReferences,
  parseCatalog,
  parseLesson,
  type CatalogDTO,
  type ContentIssue,
} from "./parseContent";

const catalogModules = import.meta.glob<{ default: unknown }>("./catalog.json", {
  eager: true,
});
const lessonModules = import.meta.glob<{ default: unknown }>("./lessons/*.json", {
  eager: true,
});

/**
 * Розбіжність контенту з типами — в консоль, а не виняток.
 *
 * Автор контенту має побачити **усі** помилки свого уроку й решту уроків на місці.
 * Кинутий виняток показав би першу помилку й порожній застосунок, тобто автор
 * лагодив би контент наосліп — рівно те, задля чого цей файл і існує.
 * Справжні ворота — `content.test.ts`, і вони червоніють на тому самому розборі.
 */
const report = (where: string, issues: ContentIssue[]) => {
  if (issues.length === 0) return;

  console.error(
    [
      `Контент «${where}» не зійшовся з типами проєкту:`,
      ...issues.map((issue) => `  ${issue.where}: ${issue.message}`),
    ].join("\n"),
  );
};

const readCatalog = (): CatalogDTO => {
  const [path, module] = Object.entries(catalogModules)[0] ?? [];
  if (!module) return { tracks: [], courses: [], modules: [] };

  const { catalog, issues } = parseCatalog(module.default, path);
  report(path, issues);
  return catalog;
};

/**
 * Ассети лежать у `public/`, тож їхня адреса залежить від префікса, під яким
 * стоїть застосунок: локально `/`, на GitHub Pages — `/code-nature/`.
 * У JSON url записана від кореня (`/content/assets/beans.svg`), бо в `srcdoc`
 * пісочниці відносна адреса ні до чого не прив'язана — там потрібна абсолютна.
 *
 * Перерахунок живе тут, у мок-джерелі контенту: саме воно знає, де лежать його
 * власні файли. У Фазі 8 адреси почне віддавати сервер, і ця функція зникне
 * разом із мокою, а не лишиться переписувати чужі url.
 */
const withBaseAssets = (lesson: LessonDTO): LessonDTO => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  if (base === "" || lesson.assets.length === 0) return lesson;

  return {
    ...lesson,
    assets: lesson.assets.map((asset) =>
      // `//cdn/...` — чужий хост, його не чіпаємо.
      asset.url.startsWith("/") && !asset.url.startsWith("//")
        ? { ...asset, url: `${base}${asset.url}` }
        : asset,
    ),
  };
};

const readLessons = (): LessonDTO[] => {
  const lessons = Object.entries(lessonModules)
    // Порядок теки залежить від файлової системи, а каталог має бути однаковий
    // у всіх запусках — інакше «перший курс» на сторінці плаває без причини.
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, module]) => {
      const { lesson, issues } = parseLesson(module.default, path);
      report(path, issues);
      return withBaseAssets(lesson);
    });

  // Посилання між уроками видно лише тоді, коли прочитані всі: розбір одного
  // файлу не знає, чи існує урок, на який той посилається.
  report("посилання між уроками", checkLessonReferences(lessons));

  return lessons;
};

export const fileCatalog: CatalogDTO = readCatalog();
export const fileLessons: LessonDTO[] = readLessons();

export const getFileCoursesByTrackSlug = (trackSlug: string) => {
  const trackIds = new Set(
    fileCatalog.tracks.filter((track) => track.slug === trackSlug).map((track) => track.id),
  );

  return fileCatalog.courses.filter(
    (course) => course.isPublished && trackIds.has(course.trackId),
  );
};

export const getFileModulesForCourse = (courseId: string) =>
  fileCatalog.modules
    .filter((module) => module.isPublished && module.courseId === courseId)
    .sort((a, b) => a.orderIndex - b.orderIndex);

export const getFileLessonsForModule = (moduleId: string) =>
  fileLessons
    .filter((lesson) => lesson.isPublished && lesson.moduleId === moduleId)
    .sort((a, b) => a.orderIndex - b.orderIndex);

export const getFileLesson = (lessonId: string) =>
  fileLessons.find((lesson) => lesson.isPublished && lesson.id === lessonId) ?? null;
