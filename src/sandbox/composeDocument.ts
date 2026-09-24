/**
 * Складання сторінки уроку з файлів: який файл вантажиться, що робити з сусідніми
 * і як туди потрапляє агент.
 *
 * Функції чисті — саме тому вони тут, а не в агенті: помилка тут **тиха**
 * (стилі просто не застосувались), а коштує учневі непрохідного завдання.
 *
 * Головне рішення (PLATFORM_UA, розділ 5, «Формат документа уроку»):
 * **entry-файл — цілий документ, і рушій не додає нічого від себе.** Доки рушій
 * підставляв власні `<!doctype>`, `<head>` і `<style>`, `<link rel="stylesheet">`
 * не просто не працював, а **імітував успіх**: стилі застосовувались однаково
 * і з правильним посиланням, і з одруком в імені файлу, і взагалі без нього.
 */

import type { RunnerFile } from "../domain/runner";

/**
 * Файл, який вантажиться першим. Імʼя не вгадується: `index.html` — лише
 * найчастіший випадок, а вкладки будуються з `files[]`, хай як вони звуться.
 */
export const findEntryFile = (files: RunnerFile[]): RunnerFile | null =>
  files.find((file) => file.isEntry) ?? null;

/**
 * Вміст `<style>` і `<script>` серіалізується в HTML **як є**: браузер його
 * не екранує. Тож `</style>` усередині CSS-коментаря закриє тег раніше часу,
 * і решта файлу виллється видимим текстом у сторінку — при тому, що з тим
 * самим файлом, підключеним справжнім `<link>`, усе працювало б.
 *
 * `<\/style>` браузер уже не бачить як кінець тега, а CSS і JS читають `\/`
 * як звичайний слеш. Тобто поведінка сторінки не міняється, а розрив зникає.
 */
const escapeClosingTag = (source: string, tag: "style" | "script") =>
  source.replace(new RegExp(`</(?=${tag})`, "gi"), String.raw`<\/`);

/** `./style.css` і `style.css` — те саме посилання; `/style.css` — інше. */
const normalizeHref = (href: string) => href.replace(/^\.\//, "");

/**
 * Підстановка сусідніх файлів **на місці**: елемент лишається, одразу після нього
 * зʼявляється `<style>` із вмістом файлу.
 *
 * Три наслідки, і всі три потрібні:
 *
 * | Що написав учень | Що бачить |
 * |---|---|
 * | `href="style.css"` правильно | сторінка стилізована |
 * | `href="styl.css"` з одруком | **без стилів** — справжній наслідок справжньої помилки |
 * | `<link>` не написав | **без стилів** |
 *
 * Селекторне правило по `link` при цьому працює (елемент на місці), а
 * `getComputedStyle` показує колір лише якщо підключення справді спрацювало.
 * Тобто «перевіряй результат, а не код» тут нарешті виконуваний, а не декларований.
 *
 * **Чому елемент ще й глушиться `media="not all"`.** Файлової системи в пісочниці
 * немає, тож `href` учня нікуди не веде — а зовнішня таблиця стилів **блокує
 * відмальовку**, доки не завантажиться. Виміряно в браузері: DOM правильний,
 * перевірка проходить, а учень бачить білий прямокутник, бо запит на непрозорому
 * origin не завершується.
 *
 * `media="not all"` вимикає рівно це: елемент лишається в DOM зі своїм `rel`
 * і `href`, селекторні правила його бачать, а зовнішній файл більше не блокує
 * сторінку. Глушник зникне разом із причиною, коли пісочниця дістане власний
 * origin і service worker, — тоді `href` вестиме до справжнього файлу.
 */
export const applyNeighborFiles = (doc: Document, files: RunnerFile[]): void => {
  const byName = new Map(files.map((file) => [file.name, file]));

  for (const link of Array.from(doc.querySelectorAll("link[rel~=stylesheet]"))) {
    // Глушиться **кожне** посилання, а не лише підставлене: саме ненайдений файл
    // — той випадок, заради якого все це робиться, і біла сторінка замість
    // «сторінки без стилів» знищила б урок, у якому вчать помічати одрук.
    link.setAttribute("media", "not all");

    const href = link.getAttribute("href");
    if (!href) continue;

    const file = byName.get(normalizeHref(href));
    if (!file || file.language !== "css") continue;

    const style = doc.createElement("style");
    style.textContent = escapeClosingTag(file.content, "style");
    link.after(style);
  }
};

/**
 * Агент їде **першим елементом `<head>`**, ще перед усім, що написав учень:
 * інакше помилка в його першому ж скрипті станеться раніше, ніж буде кому її почути.
 *
 * Свій елемент агент прибирає сам, щойно почав працювати (`currentScript.remove()`),
 * тож у DOM, який бачить перевірка, сліду не лишається. Це важливо: інакше урок
 * «порахуй теги на сторінці» рахував би наш.
 */
const injectAgent = (doc: Document, agentSource: string): void => {
  const script = doc.createElement("script");
  script.textContent = escapeClosingTag(agentSource, "script");
  doc.head.prepend(script);
};

/** Doctype учня переписувати не можна: саме його перевіряє правило `hasDoctype`. */
const serialize = (doc: Document) => {
  const doctype = doc.doctype ? `<!DOCTYPE ${doc.doctype.name}>\n` : "";
  return doctype + doc.documentElement.outerHTML;
};

/**
 * Сторінка учня разом з агентом — те, що стає `srcdoc` пісочниці.
 *
 * **Чому саме `srcdoc`, а не `document.write` у вже відкриту пісочницю.** Запис
 * у живий документ здається дешевшим, але коштує трьох окремих бід, і всі три
 * виміряні в браузері: `document.open()` знімає слухачів із `window`; запис під
 * час власного завантаження лишає парсер у напівстані; а головне — Chromium
 * не планує кадр для так записаного документа, тож DOM правильний, перевірка
 * проходить, і при цьому учень бачить **білий прямокутник**.
 *
 * Перезавантаження `srcdoc` дає ще одну річ, яку інакше довелось би робити
 * руками: кожен запуск отримує **нове вікно**, тож `setInterval`, заведений
 * минулою спробою, помирає сам. Саме це в розділі 5 названо тим, що «переживає
 * і Run, і Clear».
 */
export const composePage = (
  entryContent: string,
  files: RunnerFile[],
  agentSource: string,
): string => {
  const doc = new DOMParser().parseFromString(entryContent, "text/html");

  applyNeighborFiles(doc, files);
  injectAgent(doc, agentSource);

  return serialize(doc);
};
