import { describe, expect, it } from "vitest";

import { getLessonCompletion } from "./lessonCompletion";
import type { LessonCompletionInput } from "./lessonCompletion";

const input = (patch: Partial<LessonCompletionInput>): LessonCompletionInput => ({
  validationType: "auto",
  tasks: [],
  taskStatus: undefined,
  isMarkedDone: false,
  ...patch,
});

describe("getLessonCompletion", () => {
  it("auto: урок без завдань НЕ завершується — умова істинна на порожній множині", () => {
    expect(getLessonCompletion(input({ validationType: "auto", tasks: [] }))).toEqual({
      completed: false,
      blockedBy: "noRule",
    });
  });

  it("auto: завершується, коли зараховані всі завдання, і не раніше", () => {
    const tasks = [{ id: "t1" }, { id: "t2" }];

    expect(
      getLessonCompletion(input({ tasks, taskStatus: { t1: true } })),
    ).toEqual({ completed: false, blockedBy: "tasks" });

    expect(
      getLessonCompletion(input({ tasks, taskStatus: { t1: true, t2: true } })),
    ).toEqual({ completed: true });
  });

  it("auto: чужі зараховані завдання в сховищі не завершують урок", () => {
    // Перейменоване або видалене завдання лишається в прогресі назавжди.
    expect(
      getLessonCompletion(
        input({ tasks: [{ id: "t1" }], taskStatus: { t_old: true } }),
      ),
    ).toEqual({ completed: false, blockedBy: "tasks" });
  });

  it("none: завершує лише явна дія учня", () => {
    expect(getLessonCompletion(input({ validationType: "none" }))).toEqual({
      completed: false,
      blockedBy: "confirmation",
    });

    expect(
      getLessonCompletion(input({ validationType: "none", isMarkedDone: true })),
    ).toEqual({ completed: true });
  });

  it("manual: без викладача урок не завершується нічим", () => {
    expect(
      getLessonCompletion(
        input({
          validationType: "manual",
          tasks: [{ id: "t1" }],
          taskStatus: { t1: true },
          isMarkedDone: true,
        }),
      ),
    ).toEqual({ completed: false, blockedBy: "teacher" });
  });
});
