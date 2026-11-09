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

import type { RunnerAsset, RunnerFile } from "../domain/runner";

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
 * Посилання «всередину уроку» чи назовні. Зі схемою (`https:`, `data:`) або
 * протокольно-відносне (`//cdn…`) — зовнішнє, воно справді кудись веде
 * і в пісочниці завантажується звичайним крос-origin правилом.
 */
const isRelativeRef = (ref: string) => !/^[a-z][a-z0-9+.-]*:/i.test(ref) && !ref.startsWith("//");

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
const applyStylesheets = (
  doc: Document,
  byName: Map<string, RunnerFile>,
): void => {
  for (const link of Array.from(doc.querySelectorAll("link[rel~=stylesheet]"))) {
    const href = link.getAttribute("href");
    if (!href) continue;

    // Зовнішня таблиця стилів веде в справжній інтернет і в пісочниці
    // завантажується звичайним крос-origin правилом. Доки глушник стояв
    // на всіх, урок про Google Fonts був неможливий: учень підключав шрифт
    // правильно й не бачив нічого.
    if (!isRelativeRef(href)) continue;

    // Відносне глушиться **завжди**, а не лише коли файл знайдено: саме
    // ненайдений файл — той випадок, заради якого все це робиться, і біла
    // сторінка замість «сторінки без стилів» знищила б урок, у якому вчать
    // помічати одрук.
    link.setAttribute("media", "not all");

    const file = byName.get(normalizeHref(href));
    if (!file || file.language !== "css") continue;

    const style = doc.createElement("style");
    style.textContent = escapeClosingTag(file.content, "style");
    link.after(style);
  }
};

/**
 * `<script src="script.js">` — те саме, що `<link>`, другим тегом: елемент
 * лишається на місці, одразу після нього їде `<script>` із кодом учня.
 *
 * Позиція має значення й тому вона тут, а не в кінці `<body>`: скрипт у `<head>`
 * без `defer` виконається до того, як зʼявиться розмітка, і `querySelector`
 * поверне `null` — рівно так, як у справжньому браузері. Це наслідок, а не баг:
 * урок про те, **де** ставити скрипт, інакше був би неперевірним.
 *
 * **Чому оригінал глушиться `type="text/plain"`.** Той самий непрозорий origin,
 * що й у `<link>`: відносний `src` нікуди не веде. Скрипт із не-JS типом браузер
 * не вантажить і не виконує взагалі, а `src` і решта атрибутів лишаються в DOM,
 * тож селекторне правило по `script[src]` працює. Це глушник-близнюк `media="not all"`.
 *
 * **Правило те саме, що в `<link>`:** глушиться лише **відносне** посилання.
 * Зовнішній `<script src="https://…">` у пісочниці справді завантажується
 * й має працювати.
 *
 * Межа, названа чесно: `defer` і `async` на вставленому скрипті браузер ігнорує,
 * бо вони працюють лише для зовнішніх. Тож урок, який вчить саме `defer`,
 * показав би неправду — **тригер** переписати підстановку на `blob:`/`data:` URL
 * замість інлайну.
 */
const applyScripts = (doc: Document, byName: Map<string, RunnerFile>): void => {
  for (const script of Array.from(doc.querySelectorAll("script[src]"))) {
    const src = script.getAttribute("src");
    if (!src) continue;
    if (!isRelativeRef(src)) continue;

    script.setAttribute("type", "text/plain");

    const file = byName.get(normalizeHref(src));
    if (!file || file.language !== "javascript") continue;

    const inline = doc.createElement("script");
    inline.textContent = escapeClosingTag(file.content, "script");
    script.after(inline);
  }
};

/** `url(x)`, `url('x')`, `url("x")` — три записи того самого. */
const CSS_URL = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;

/**
 * Ассети: імена з уроку перетворюються на справжні адреси.
 *
 * Місць **два**, і друге легко пропустити:
 *
 * | Де | Що робимо |
 * |---|---|
 * | `<img src="beans.svg">` | міняємо `src` |
 * | `url(beans.svg)` усередині `<style>` | міняємо всередині тексту стилів |
 *
 * Друге потрібне рівно тому, що css-файл уроку **інлайниться** в `<style>`:
 * відносний `url()` у ньому резолвиться в порожнечу так само, як `href`
 * у `<link>`, — і фон із картинкою мовчки не працює.
 *
 * Зовнішні адреси не чіпаємо: вони ведуть у справжній інтернет, і в пісочниці
 * це працює. Невідоме відносне імʼя теж лишаємо як є — учень має побачити
 * наслідок власної описки, а не мовчазну підміну.
 *
 * Межа названа чесно: `srcset` і `<source>` тут не розбираються — для них
 * тригером буде перший урок про адаптивні зображення.
 */
const applyAssets = (doc: Document, assets: RunnerAsset[]): void => {
  if (assets.length === 0) return;
  const byName = new Map(assets.map((asset) => [asset.name, asset.url]));

  const resolve = (ref: string): string | null => {
    if (!isRelativeRef(ref)) return null;
    return byName.get(normalizeHref(ref)) ?? null;
  };

  for (const image of Array.from(doc.querySelectorAll("img[src]"))) {
    const url = resolve(image.getAttribute("src") ?? "");
    if (url) image.setAttribute("src", url);
  }

  // Усі `<style>`, а не лише вставлені нами: учень міг написати `url()`
  // і в своєму інлайновому стилі, і там воно ламається так само.
  for (const style of Array.from(doc.querySelectorAll("style"))) {
    const css = style.textContent;
    if (!css || !css.includes("url(")) continue;

    style.textContent = css.replace(CSS_URL, (whole, quote: string, ref: string) => {
      const url = resolve(ref);
      return url ? `url(${quote}${url}${quote})` : whole;
    });
  }
};

export const applyNeighborFiles = (
  doc: Document,
  files: RunnerFile[],
  assets: RunnerAsset[] = [],
): void => {
  const byName = new Map(files.map((file) => [file.name, file]));

  applyStylesheets(doc, byName);
  applyScripts(doc, byName);
  // Після стилів: `url()` усередині щойно вставленого css теж має розвʼязатись.
  applyAssets(doc, assets);
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
  assets: RunnerAsset[] = [],
): string => {
  const doc = new DOMParser().parseFromString(entryContent, "text/html");

  applyNeighborFiles(doc, files, assets);
  injectAgent(doc, agentSource);

  return serialize(doc);
};
