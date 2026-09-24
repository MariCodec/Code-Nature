/**
 * Сторона сторінки: транспорт до пісочниці.
 *
 * Перевірка тут **асинхронна**, і це не деталь реалізації, а форма. Пісочниця
 * недоступна ззовні за визначенням, тож «викликали — результат є» більше немає:
 * кожен запуск це round-trip повідомленнями, і кожен виклик мусить уміти
 * «відповіді не буде ніколи» (PLATFORM_UA, розділ 5, «Режим відмови»).
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import agentSource from "virtual:sandbox-agent";

import { isRunnerEvent } from "../domain/runner";
import type { RunnerFile, RunnerRequest, TaskResult } from "../domain/runner";
import type { TaskRules } from "../types/lessonTypes";
import { composePage, findEntryFile } from "./composeDocument";
import type { SandboxFrameHandle } from "./SandboxFrame";

/** Порожня пісочниця: агент є, сторінки учня ще (або вже) немає. */
const BLANK_PAGE = composePage("", [], agentSource);

/**
 * Скільки чекаємо на відповідь. `while (true)` в уроці не дасть її ніколи,
 * а стек пісочниці нам не належить — зупинити його можна лише перестворенням iframe.
 */
const CHECK_DEADLINE_MS = 5_000;

/** Ліміт на видимі проблеми: `console.error` у циклі не має класти сторінку. */
const MAX_PROBLEMS = 20;

export type SandboxProblem = { level: "warn" | "error"; text: string };

export type SandboxCheckTask = { id: string; rules: TaskRules };

export type SandboxCheckOutcome =
  | { status: "done"; results: TaskResult[] }
  /** Відповіді не буде: дедлайн вийшов, iframe перестворено. */
  | { status: "timeout" };

type PendingCheck = { resolve: (outcome: SandboxCheckOutcome) => void; timer: number };

export type Sandbox = {
  frame: SandboxFrameHandle;
  problems: SandboxProblem[];
  /** Завантажити сторінку учня в нове вікно пісочниці. */
  run: (files: RunnerFile[]) => void;
  /** Перевірити завдання по живому DOM. Ніколи не висить: або результат, або `timeout`. */
  check: (tasks: SandboxCheckTask[]) => Promise<SandboxCheckOutcome>;
  /** Перестворити пісочницю порожньою: єдиний спосіб зупинити чужий цикл. */
  reset: () => void;
};

export const useSandbox = (): Sandbox => {
  const ref = useRef<HTMLIFrameElement | null>(null);
  const [page, setPage] = useState({ generation: 0, srcdoc: BLANK_PAGE });
  const [problems, setProblems] = useState<SandboxProblem[]>([]);

  const isReady = useRef(false);
  /** Запити, надіслані до `ready`: губити їх не можна, iframe вантажиться асинхронно. */
  const queue = useRef<RunnerRequest[]>([]);
  const pending = useRef(new Map<string, PendingCheck>());
  const lastCheckId = useRef(0);

  const send = useCallback((request: RunnerRequest) => {
    if (!isReady.current) {
      queue.current.push(request);
      return;
    }
    // Цільовий origin лише `*`: у пісочниці він непрозорий, іншого значення немає.
    ref.current?.contentWindow?.postMessage(request, "*");
  }, []);

  /**
   * Агент озвався — відпускаємо чергу.
   *
   * Єдиний сигнал готовності — саме повідомлення `ready`. Подія `load` на iframe
   * для цього **не годиться**, хоч і виглядає надійнішою: новий iframe устигає
   * повідомити про завантаження ще порожнього `about:blank`, тобто до того, як
   * розібраний `srcdoc` і виконаний агент. Спіймано в браузері: сторінка уроку,
   * відкрита через екран «спершу відео», лишалась порожньою назавжди — запит
   * пішов у вікно, якому нема кому його почути, а справжній `ready` уже нічого
   * не відпускав, бо готовність була позначена.
   */
  const markReady = useCallback(() => {
    if (isReady.current) return;
    isReady.current = true;

    const queued = queue.current;
    queue.current = [];
    for (const request of queued) ref.current?.contentWindow?.postMessage(request, "*");
  }, []);

  const settle = useCallback((checkId: string, outcome: SandboxCheckOutcome) => {
    const check = pending.current.get(checkId);
    if (!check) return;

    window.clearTimeout(check.timer);
    pending.current.delete(checkId);
    check.resolve(outcome);
  }, []);

  /**
   * Завантажити в пісочницю нову сторінку — **нове вікно**, а не новий вміст
   * старого. Чужий `setInterval` інакше пережив би і Run, і Clear: його стек
   * нам не належить, і зупинити його можна лише разом із вікном.
   */
  const load = useCallback(
    (srcdoc: string) => {
      isReady.current = false;
      queue.current = [];

      // Хто ще чекає — не дочекається: цього вікна зараз не стане.
      for (const checkId of [...pending.current.keys()]) settle(checkId, { status: "timeout" });

      setProblems([]);
      setPage((current) => ({ generation: current.generation + 1, srcdoc }));
    },
    [settle],
  );

  const reset = useCallback(() => load(BLANK_PAGE), [load]);

  const addProblem = useCallback((problem: SandboxProblem) => {
    setProblems((current) =>
      current.length >= MAX_PROBLEMS ? current : [...current, problem],
    );
  }, []);

  /**
   * `useLayoutEffect`, а не `useEffect`: слухач мусить існувати раніше, ніж iframe
   * устигне виконати агента. Звичайний ефект — це задача після відмальовки, і
   * завантаження iframe встигає її випередити; тоді `ready` прилітає в порожнечу,
   * а сторінка учня не показується ніколи.
   */
  useLayoutEffect(() => {
    const onMessage = (event: MessageEvent<unknown>) => {
      // Гвард із двох половин. Перша: повідомлення від **нашого** iframe, а не
      // від будь-якого вікна, що має посилання на нас.
      if (!ref.current || event.source !== ref.current.contentWindow) return;
      // Друга: повна перевірка форми. Пісочниця не є довіреним співрозмовником —
      // вона за задумом виконує код учня, і той може надіслати що завгодно.
      if (!isRunnerEvent(event.data)) return;

      const runnerEvent = event.data;

      switch (runnerEvent.type) {
        case "ready":
          markReady();
          return;
        case "console":
          // `log` для цього runtime-у нікуди не веде: вікно браузера консолі
          // не показує. Свого читача він дістане разом із `code-output`.
          if (runnerEvent.level !== "log")
            addProblem({ level: runnerEvent.level, text: runnerEvent.args.join(" ") });
          return;
        case "runtime-error":
          addProblem({ level: "error", text: runnerEvent.message });
          return;
        case "result":
          settle(runnerEvent.checkId, { status: "done", results: runnerEvent.results });
          return;
        case "timeout":
          settle(runnerEvent.checkId, { status: "timeout" });
          return;
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [addProblem, markReady, settle]);

  // Сторінку залишили посеред перевірки — таймери не мають її пережити.
  useEffect(() => {
    const checks = pending.current;
    return () => {
      for (const check of checks.values()) window.clearTimeout(check.timer);
      checks.clear();
    };
  }, []);

  /**
   * Головного файлу може не бути (автор забув `isEntry`) — тоді сторінка порожня,
   * а перевірка голосно не зарахує завдання. Ворота від такого уроку —
   * схема-перевірка контенту, а не мовчазна заглушка тут.
   */
  const run = useCallback(
    (files: RunnerFile[]) => {
      const entry = findEntryFile(files);
      load(composePage(entry?.content ?? "", files, agentSource));
    },
    [load],
  );

  const check = useCallback(
    (tasks: SandboxCheckTask[]) =>
      new Promise<SandboxCheckOutcome>((resolve) => {
        lastCheckId.current += 1;
        const checkId = `chk_${lastCheckId.current}`;

        const timer = window.setTimeout(() => {
          // Спершу чесно просимо зупинитись: пісочниця, якщо жива, відповість
          // `timeout` і не надішле застарілий `result`.
          send({ type: "cancel", checkId });
          settle(checkId, { status: "timeout" });
          // А якщо не жива — лишається перестворення. Іншого способу зупинити
          // чужий нескінченний цикл не існує: його стек нам не належить.
          reset();
        }, CHECK_DEADLINE_MS);

        pending.current.set(checkId, { resolve, timer });
        send({ type: "check", checkId, tasks });
      }),
    [reset, send, settle],
  );

  return { frame: { ...page, ref }, problems, run, check, reset };
};
