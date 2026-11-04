/**
 * Пісочниця сторінки уроку: два вікна й усе, що їх звʼязує.
 *
 * | Вікно | Чиє | Що в ньому |
 * |---|---|---|
 * | `frame` | **учня** | сторінка, яку він бачить і в якій клікає сам |
 * | `checkFrame` | службове | тут працює перевірка, і воно сховане |
 *
 * Поділ зʼявився разом із діями (`act`, розділ 5): перевірка почала **клацати**
 * по сторінці. Робити це в учневому вікні означало б міняти його робочу
 * поверхню — лічильник, якого він не натискав, і блимання preview на кожен Run.
 *
 * Механіка одного вікна живе в `useSandboxWindow`: вона однакова для обох,
 * і друга копія розійшлася б із першою мовчки.
 */

import { useCallback, useState } from "react";

import type { RunnerAsset, RunnerFile, TaskResult } from "../domain/runner";
import { useSandboxWindow } from "./useSandboxWindow";
import type {
  SandboxCheckOutcome,
  SandboxCheckTask,
  SandboxConsoleLine,
} from "./useSandboxWindow";
import type { SandboxFrameHandle } from "./SandboxFrame";

export type { SandboxCheckOutcome, SandboxCheckTask, SandboxConsoleLine };

/** Ліміт на видимі рядки: `console.log` у циклі не має класти сторінку. */
const MAX_CONSOLE_LINES = 20;

/**
 * Те, що надрукувала програма учня, і те, на чому вона впала.
 *
 * `dropped` існує, бо `for (let i = 0; i < 100; i++) console.log(i)` — не
 * помилка, а звичайне перше завдання. Мовчки показати двадцять рядків зі ста
 * означає збрехати про те, що зробила програма; ліміт має бути **видимим**.
 */
export type SandboxConsole = { lines: SandboxConsoleLine[]; dropped: number };

const EMPTY_CONSOLE: SandboxConsole = { lines: [], dropped: 0 };

export type Sandbox = {
  /** Вікно учня — те, що показує `Preview`. */
  frame: SandboxFrameHandle;
  /** Службове вікно перевірки. Малюється схованим, але **малюється**. */
  checkFrame: SandboxFrameHandle;
  consoleOutput: SandboxConsole;
  /** Завантажити сторінку учня в нове вікно пісочниці. */
  run: (files: RunnerFile[], assets: RunnerAsset[]) => void;
  /**
   * Перевірити завдання. Ніколи не висить: або результат, або `timeout`.
   *
   * Файли потрібні тому, що перевірка **сама вантажить сторінку** — по одній
   * на кожне завдання, див. нижче.
   */
  check: (
    tasks: SandboxCheckTask[],
    files: RunnerFile[],
    assets: RunnerAsset[],
  ) => Promise<SandboxCheckOutcome>;
  /** Перестворити вікно учня порожнім. */
  reset: () => void;
};

export const useSandbox = (): Sandbox => {
  const [consoleOutput, setConsoleOutput] = useState<SandboxConsole>(EMPTY_CONSOLE);

  const addConsoleLine = useCallback((line: SandboxConsoleLine) => {
    setConsoleOutput((current) =>
      current.lines.length >= MAX_CONSOLE_LINES
        ? { ...current, dropped: current.dropped + 1 }
        : { ...current, lines: [...current.lines, line] },
    );
  }, []);

  const view = useSandboxWindow(addConsoleLine);
  // Службове вікно консоль не віддає: друк, спричинений **кліками перевірки**,
  // учень не робив, і показувати його як свій було б неправдою.
  const checker = useSandboxWindow();

  const viewLoad = view.load;
  const viewReset = view.reset;
  const checkerLoad = checker.load;
  const checkerReset = checker.reset;
  const checkerRequest = checker.request;

  const run = useCallback(
    (files: RunnerFile[], assets: RunnerAsset[]) => {
      setConsoleOutput(EMPTY_CONSOLE);
      viewLoad(files, assets);
    },
    [viewLoad],
  );

  const reset = useCallback(() => {
    setConsoleOutput(EMPTY_CONSOLE);
    viewReset();
  }, [viewReset]);

  /**
   * **Кожне завдання перевіряється в своєму вікні, і жодне з них не те, що
   * бачить учень.**
   *
   * Доти, доки правила лише дивились, одного завантаження вистачало на всі
   * завдання. Правило з `act` **міняє** сторінку, і звідси обидві половини:
   *
   * - своя сторінка **на кожне завдання** — інакше клік одного завдання лишав би
   *   лічильник зрушеним, і наступне перевірялось би в чужому стані. Тоді порядок
   *   завдань почав би значити, а правило, результат якого залежить від сусідів,
   *   неможливо виконати на сервері окремо (розділ 8);
   * - **не вікно учня** — інакше він бачив би наслідки кліків, яких не робив,
   *   і його сторінка перезавантажувалась би по разу на кожне завдання.
   */
  const check = useCallback(
    async (
      tasks: SandboxCheckTask[],
      files: RunnerFile[],
      assets: RunnerAsset[],
    ): Promise<SandboxCheckOutcome> => {
      if (tasks.length === 0) return { status: "done", results: [] };

      const results: TaskResult[] = [];

      for (const task of tasks) {
        checkerLoad(files, assets);

        const outcome = await checkerRequest([task]);
        // Пісочниці вже немає — решту завдань перевіряти нема де.
        if (outcome.status !== "done") return outcome;

        results.push(...outcome.results);
      }

      // Службове вікно лишається порожнім: тримати в ньому сторінку учня між
      // перевірками немає сенсу, а чужі таймери там нікому не потрібні.
      checkerReset();
      return { status: "done", results };
    },
    [checkerLoad, checkerRequest, checkerReset],
  );

  return {
    frame: view.frame,
    checkFrame: checker.frame,
    consoleOutput,
    run,
    check,
    reset,
  };
};
