import { resolve } from "node:path";

import { build } from "esbuild";
import type { Plugin } from "vite";

/**
 * Збирає агента пісочниці в **один рядок** і віддає його застосунку
 * як модуль `virtual:sandbox-agent`.
 *
 * Навіщо окремий крок збірки. Пісочниця — `sandbox="allow-scripts"` без
 * `allow-same-origin`, тобто **чужий origin**. Модульний `<script src>` звідти
 * вже підлягає CORS, а `blob:` і `import()` на наш домен закриті за визначенням —
 * саме тому вона й ізольована. Лишається один шлях: увесь код агента має бути
 * всередині `srcdoc`, інлайном.
 *
 * Ціна альтернатив була б вища. Писати агента одним файлом без імпортів
 * означало б скопіювати туди валідатор — а він мусить переїхати **незміненим**
 * (PLATFORM_UA, розділ 9, пункт 3.4), інакше перевірка в пісочниці й перевірка
 * в тестах поступово розійдуться, і жодна з них про це не скаже.
 */
const VIRTUAL_ID = "virtual:sandbox-agent";
const RESOLVED_ID = "\0" + VIRTUAL_ID;

export function sandboxAgent(entry: string): Plugin {
  const entryPath = resolve(entry);
  /** Файли, з яких зібрано агента: по них вирішуємо, чи перезбирати на HMR. */
  let sources = new Set<string>([entryPath]);

  return {
    name: "code-nature:sandbox-agent",

    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },

    async load(id) {
      if (id !== RESOLVED_ID) return null;

      const result = await build({
        entryPoints: [entryPath],
        bundle: true,
        write: false,
        format: "iife",
        target: "es2020",
        metafile: true,
        // Читабельність тут дорожча за байти: агент потрапляє в `srcdoc`,
        // і саме його видно у вкладці Elements під час налагодження.
        minify: false,
      });

      sources = new Set(Object.keys(result.metafile.inputs).map((file) => resolve(file)));
      for (const file of sources) this.addWatchFile(file);

      return `export default ${JSON.stringify(result.outputFiles[0].text)};`;
    },

    /**
     * Модуль віртуальний, тож Vite не знає, що він залежить від `src/sandbox/*`
     * і від валідатора. Без цього правка агента не давала б жодного ефекту
     * до перезапуску сервера — найгірший вид «нічого не змінилось».
     */
    handleHotUpdate({ file, server }) {
      if (!sources.has(file)) return;

      const module = server.moduleGraph.getModuleById(RESOLVED_ID);
      if (module) server.moduleGraph.invalidateModule(module);

      server.ws.send({ type: "full-reload" });
    },
  };
}
