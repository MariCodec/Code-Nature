import { describe, expect, it } from "vitest";

import { buildLessonCourseMap } from "./lessonCourses";

/**
 * Тест саме на **порядок джерел**, а не на сам мердж.
 *
 * Збігаються всі три умови правила: чиста функція; помилка тиха — переставлені
 * джерела нічого не ламають, тести лишаються зелені; наслідок серйозний —
 * прогрес приписується неіснуючому курсу й перестає групуватись.
 */
describe("buildLessonCourseMap", () => {
  it("контент перемагає збережене — інакше застарілий маркер вигравав би над правдою", () => {
    const map = buildLessonCourseMap({
      saved: [{ lessonId: "lsn_1", courseId: "unknown_course" }],
      lessonsByModule: { mod_1: [{ id: "lsn_1", courseId: "course_html" }] },
      lessonById: {},
    });

    expect(map.lsn_1).toBe("course_html");
  });

  it("повний DTO уроку перемагає список модуля", () => {
    const map = buildLessonCourseMap({
      saved: [],
      lessonsByModule: { mod_1: [{ id: "lsn_1", courseId: "course_stale" }] },
      lessonById: { lsn_1: { id: "lsn_1", courseId: "course_fresh" } },
    });

    expect(map.lsn_1).toBe("course_fresh");
  });

  it("збережене лишається, поки контент не завантажений", () => {
    const map = buildLessonCourseMap({
      saved: [{ lessonId: "lsn_1", courseId: "course_html" }],
      lessonsByModule: {},
      lessonById: {},
    });

    expect(map.lsn_1).toBe("course_html");
  });

  it("урок, невідомий жодному джерелу, лишається без курсу", () => {
    const map = buildLessonCourseMap({
      saved: [],
      lessonsByModule: {},
      lessonById: {},
    });

    expect(map.lsn_1).toBeUndefined();
  });
});
