import { describe, expect, it } from "vitest";
import {
  countCompletedTasks,
  getCurrentItem,
  getItemAccess,
  getModuleState,
  getNextStep,
  getPreviousItem,
  type ModuleContext,
  type ModuleItem,
} from "./progression";

const lesson = (id: string, orderIndex: number): ModuleItem => ({
  id,
  courseId: "crs",
  moduleId: "mod",
  lessonKind: "lesson",
  orderIndex,
  title: id,
});

const techCheck = (id: string, orderIndex: number): ModuleItem => ({
  id,
  courseId: "crs",
  moduleId: "mod",
  lessonKind: "tech_check",
  orderIndex,
  title: id,
});

const ctx = (
  items: ModuleItem[],
  completed: string[] = [],
  nextModuleId: string | null = null,
): ModuleContext => ({ items, completedIds: new Set(completed), nextModuleId });

// Техчек із orderIndex = 1 навмисно: він має стати останнім усупереч числу.
const items = [lesson("l1", 1), lesson("l2", 2), lesson("l3", 3), techCheck("tc", 1)];

describe("getModuleState", () => {
  it("ставить техчек останнім попри orderIndex і не рахує його серед уроків", () => {
    const state = getModuleState(ctx(items));
    expect(state.ordered.map((i) => i.id)).toEqual(["l1", "l2", "l3", "tc"]);
    expect(state.totalLessonsCount).toBe(3);
  });

  it("пройдені уроки ще не закривають модуль — потрібен техчек", () => {
    const state = getModuleState(ctx(items, ["l1", "l2", "l3"]));
    expect(state.allLessonsDone).toBe(true);
    expect(state.isModuleComplete).toBe(false);
  });

  it("модуль закривається техчеком", () => {
    expect(getModuleState(ctx(items, ["l1", "l2", "l3", "tc"])).isModuleComplete).toBe(true);
  });

  it("складений техчек при непройдених уроках модуль не закриває", () => {
    // Захист від протікання доступу: якщо кудись пустили повз ворота,
    // модуль однаково лишається незавершеним.
    expect(getModuleState(ctx(items, ["tc"])).isModuleComplete).toBe(false);
  });

  it("без техчека модуль закривається останнім уроком", () => {
    const noCheck = [lesson("l1", 1), lesson("l2", 2)];
    expect(getModuleState(ctx(noCheck, ["l1", "l2"])).isModuleComplete).toBe(true);
  });

  it("порожній модуль не вважається пройденим", () => {
    // Реальний випадок: курс CSS має модуль без жодного уроку
    expect(getModuleState(ctx([])).isModuleComplete).toBe(false);
  });
});

describe("getItemAccess", () => {
  it("урок закритий, поки не пройдено попередній", () => {
    expect(getItemAccess("l2", ctx(items))).toEqual({
      unlocked: false,
      reason: "previous-lesson-incomplete",
      remaining: 1,
    });
  });

  it("техчек закритий, поки лишився хоч один урок", () => {
    expect(getItemAccess("tc", ctx(items, ["l1", "l2"]))).toEqual({
      unlocked: false,
      reason: "module-lessons-incomplete",
      remaining: 1,
    });
  });

  it("техчек відкривається лише після всіх уроків модуля", () => {
    expect(getItemAccess("tc", ctx(items, ["l1", "l2", "l3"]))).toEqual({ unlocked: true });
  });
});

describe("getNextStep", () => {
  it("веде до наступного уроку", () => {
    expect(getNextStep("l1", ctx(items, ["l1"]))).toEqual({
      kind: "lesson",
      item: expect.objectContaining({ id: "l2" }),
    });
  });

  it("після останнього уроку показує замкнений техчек із причиною", () => {
    expect(getNextStep("l3", ctx(items, ["l3"]))).toEqual({
      kind: "tech-check-locked",
      item: expect.objectContaining({ id: "tc" }),
      remaining: 2,
    });
  });

  it("після останнього уроку відкриває техчек, коли модуль пройдено", () => {
    expect(getNextStep("l3", ctx(items, ["l1", "l2", "l3"]))).toEqual({
      kind: "tech-check",
      item: expect.objectContaining({ id: "tc" }),
    });
  });

  it("після техчека веде до завершення модуля, а не в глухий кут", () => {
    expect(getNextStep("tc", ctx(items, ["l1", "l2", "l3", "tc"], "mod2"))).toEqual({
      kind: "module-complete",
      nextModuleId: "mod2",
    });
  });

  it("модуль без техчека завершується після останнього уроку", () => {
    const noCheck = [lesson("l1", 1), lesson("l2", 2)];
    expect(getNextStep("l2", ctx(noCheck, ["l1", "l2"], "mod2"))).toEqual({
      kind: "module-complete",
      nextModuleId: "mod2",
    });
  });
});

describe("getPreviousItem", () => {
  it("з техчека повертає останній урок", () => {
    expect(getPreviousItem("tc", ctx(items))?.id).toBe("l3");
  });
});

describe("getCurrentItem", () => {
  it("зсувається на наступний після проходження", () => {
    expect(getCurrentItem(ctx(items, ["l1"]))?.id).toBe("l2");
  });

  it("після всіх уроків це техчек", () => {
    expect(getCurrentItem(ctx(items, ["l1", "l2", "l3"]))?.id).toBe("tc");
  });

  it("не вказує на замкнений техчек", () => {
    // l3 не пройдено, тож поточний саме l3, а не техчек
    expect(getCurrentItem(ctx(items, ["l1", "l2"]))?.id).toBe("l3");
  });

  it("коли все пройдено — нічого", () => {
    expect(getCurrentItem(ctx(items, ["l1", "l2", "l3", "tc"]))).toBeNull();
  });
});

describe("countCompletedTasks", () => {
  it("ігнорує записи від завдань, яких уже немає", () => {
    // Саме цей випадок давав «7 з 4»: старі id лишились у збереженому прогресі
    expect(
      countCompletedTasks([{ id: "t1" }, { id: "t2" }], {
        t1: true,
        t2: true,
        old1: true,
        old2: true,
      }),
    ).toBe(2);
  });
});
