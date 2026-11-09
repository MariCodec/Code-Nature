import { describe, expect, it } from "vitest";

import { getLessonSteps } from "./lessonSteps";
import type { LessonStepsInput } from "./lessonSteps";

const input = (patch: Partial<LessonStepsInput>): LessonStepsInput => ({
  videos: [],
  theoryBlocks: [],
  tasks: [],
  hasEditor: false,
  ...patch,
});

const kinds = (patch: Partial<LessonStepsInput>) =>
  getLessonSteps(input(patch)).map((step) => step.kind);

const video = (sourceUrl: string | null) => ({ sourceUrl });

describe("getLessonSteps", () => {
  it("порядок завжди один: відео → теорія → практика", () => {
    expect(
      kinds({
        videos: [video("https://example.test/v.mp4")],
        theoryBlocks: [{}],
        tasks: [{}],
        hasEditor: true,
      }),
    ).toEqual(["video", "theory", "practice"]);
  });

  it("відео без джерела кроку не дає — заглушка це лист авторові, не урок", () => {
    expect(kinds({ videos: [video(null)], theoryBlocks: [{}] })).toEqual(["theory"]);
    expect(kinds({ videos: [video("   ")], theoryBlocks: [{}] })).toEqual(["theory"]);
  });

  it("досить одного відео з джерелом серед кількох порожніх", () => {
    expect(
      kinds({ videos: [video(null), video("https://example.test/v.mp4")] }),
    ).toEqual(["video"]);
  });

  it("теорії немає — урок починається з практики", () => {
    expect(kinds({ tasks: [{}], hasEditor: true })).toEqual(["practice"]);
  });

  it("практика потребує і редактора, і завдань — окремо кожне не рахується", () => {
    // Редактор без завдань — урок, де нема чого робити; завдання без редактора —
    // завдання, яке нема де виконати. Обидва випадки колись давали порожній крок.
    expect(kinds({ hasEditor: true, theoryBlocks: [{}] })).toEqual(["theory"]);
    expect(kinds({ tasks: [{}], theoryBlocks: [{}] })).toEqual(["theory"]);
  });

  it("урок зовсім без вмісту дає нуль кроків, а не порожній крок", () => {
    // Це недописаний контент. Відповідь «кроків немає» мусить дійти до сторінки,
    // інакше вона намалює каркас навколо порожнечі.
    expect(kinds({})).toEqual([]);
    expect(kinds({ videos: [video(null)] })).toEqual([]);
  });
});
