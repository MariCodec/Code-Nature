import type { RefObject } from "react";

/**
 * Усе, що потрібно, аби намалювати вікно пісочниці. Складає це `useSandbox`,
 * а куди його поставити — вирішує `Preview` конкретного runtime-у: для
 * `html-css-preview` це вікно браузера, для майбутнього `code-output` воно
 * взагалі може бути сховане.
 */
export type SandboxFrameHandle = {
  /** Змінюється на кожен запуск: нове вікно — єдиний спосіб позбутись чужих таймерів. */
  generation: number;
  /** Сторінка учня разом з агентом. Складає `composePage`. */
  srcdoc: string;
  ref: RefObject<HTMLIFrameElement | null>;
};

/**
 * Єдине місце, де створюється iframe для коду учня.
 *
 * `sandbox="allow-scripts"` **без** `allow-same-origin` — не оптимізація і не
 * налаштування: це і є інваріант «код учня ніколи не виконується на origin
 * застосунку» (PLATFORM_UA, розділ 5). Разом із `srcdoc` це дає непрозорий
 * origin: ні `parent.localStorage`, ні `contentDocument` звідти недоступні.
 *
 * `allow-same-origin` тут не зʼявиться ніколи: у парі з `srcdoc` на нашому
 * домені воно точно дорівнює відсутності пісочниці.
 *
 * `key` по `generation` — щоб кожен запуск отримував **новий** елемент, а з ним
 * і нове вікно. Інакше `setInterval` з минулої спроби пережив би і Run, і Clear.
 */

const SandboxFrame = ({
  frame,
  className,
  title,
}: {
  frame: SandboxFrameHandle;
  className?: string;
  title: string;
}) => (
  <iframe
    key={frame.generation}
    ref={frame.ref}
    className={className}
    title={title}
    sandbox="allow-scripts"
    srcDoc={frame.srcdoc}
  />
);

export default SandboxFrame;
