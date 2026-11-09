import { copyFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { Plugin, ResolvedConfig } from "vite";

/**
 * SPA на статичному хостингу: будь-яка адреса має віддавати ту саму сторінку.
 *
 * GitHub Pages — звичайний файловий сервер: `/{base}/student/learning` для нього
 * тека, якої немає, і він віддає 404 замість застосунку. Тобто перезавантаження
 * сторінки уроку або пряме посилання в резюме не працювали б — а саме так
 * демо й відкривають.
 *
 * Рішення — копія `index.html` під імʼям `404.html`: Pages віддає її на будь-яку
 * невідому адресу, застосунок стартує й сам читає `location.pathname`. Статус
 * відповіді лишається 404, і для SEO це погано, але демо це не псує; чесний
 * фікс — серверний рендер, він у відкритих питаннях розділу 8.
 *
 * Копіюємо з диска в `closeBundle`, а не через `emitFile` у `generateBundle`:
 * `index.html` на той момент ще не в бандлі — його додає плагін Vite, який іде
 * після цього. Перша версія саме через це мовчки не створювала нічого.
 *
 * `.nojekyll` поруч вимикає Jekyll, який інакше ховає файли й теки з `_`.
 */
export function spaFallback(): Plugin {
  let outDir = "dist";

  return {
    name: "code-nature:spa-fallback",
    apply: "build",

    configResolved(config: ResolvedConfig) {
      outDir = resolve(config.root, config.build.outDir);
    },

    async closeBundle() {
      await copyFile(resolve(outDir, "index.html"), resolve(outDir, "404.html"));
      await writeFile(resolve(outDir, ".nojekyll"), "");
    },
  };
}
