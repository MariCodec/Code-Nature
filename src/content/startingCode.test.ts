// @vitest-environment happy-dom
// @vitest-environment-options { "settings": { "disableCSSFileLoading": true, "handleDisabledFileLoadingAsSuccess": true } }

/**
 * Жодне завдання не має бути зараховане **до того, як учень щось зробив**.
 *
 * Це не теорія. `tsk_first_1` у `html-first-page` зараховувався на недоторканій
 * заготовці: вона містила `<h1>Мій перший сайт</h1>`, а правило вимагало `h1`
 * з текстом від трьох символів. Перше практичне завдання курсу було закрите
 * ще до відкриття уроку, і схема-перевірка мовчала — бо форма правил бездоганна,
 * помилка у **звʼязку** правила зі стартовим кодом.
 *
 * Тому перевірка тут не декларативна, а **виконавча**: документ складає той самий
 * `composePage`, дії виконує той самий `performActions`, вердикт виносить той самий
 * `checkTask`. Друга реалізація чогось із цього розійшлася б із бойовою мовчки.
 *
 * Межа названа чесно: скрипти учня в happy-dom не виконуються, тож для `js-dom`
 * цей тест доводить менше, ніж для html/css — він каже «не зараховано», але
 * не розрізняє «бо учень ще нічого не написав» і «бо скрипт не запустився».
 * Для його задачі — впіймати завдання, істинне на старті, — цього досить.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { parseLesson } from "./parseContent";
import { composePage, findEntryFile } from "../sandbox/composeDocument";
import { performActions } from "../sandbox/actions";
import { checkTask } from "../domain/taskValidation";
import type { LessonDTO } from "../types/content";

const LESSONS_DIR = join(__dirname, "lessons");
const lessonFiles = readdirSync(LESSONS_DIR).filter((name) => name.endsWith(".json"));

const readLesson = (name: string): LessonDTO =>
  parseLesson(JSON.parse(readFileSync(join(LESSONS_DIR, name), "utf8")), name).lesson;

/** Той самий шлях, що в бою: файли → `composePage` → живий документ. */
const openStartingPage = (lesson: LessonDTO): Document => {
  const files = lesson.files.map((file) => ({
    name: file.name,
    language: file.language,
    content: file.initialContent,
    isEntry: file.isEntry,
  }));

  const entry = findEntryFile(files);
  const html = composePage(entry?.content ?? "", files, "");

  // Глобальний документ, а не `createHTMLDocument()`: у створеного happy-dom
  // не дає `defaultView`, тобто `getComputedStyle` не працює й правила
  // `cssChecks` мовчки зараховувались би.
  document.open();
  document.write(html);
  document.close();

  return document;
};

describe("стартовий код не зараховує жодного завдання", () => {
  it.each(lessonFiles)("%s", (name) => {
    const lesson = readLesson(name);
    const domTasks = lesson.tasks.filter((task) => task.rules.kind === "dom");
    if (domTasks.length === 0) return;

    const credited: string[] = [];

    for (const task of domTasks) {
      const doc = openStartingPage(lesson);

      // Своя сторінка на кожне завдання — так само, як у пісочниці.
      if (task.rules.kind === "dom" && task.rules.act?.length)
        performActions(doc, task.rules.act);

      if (checkTask(doc, task.rules).passed) credited.push(task.id);
    }

    expect(credited).toEqual([]);
  });
});
