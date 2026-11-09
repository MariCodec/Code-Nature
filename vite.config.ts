import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

import { sandboxAgent } from './vite/sandboxAgent'
import { spaFallback } from './vite/spaFallback'

/**
 * `base` різний для dev і build навмисно. Демо живе на GitHub Pages у підтеці
 * `/Code-Nature/`, і зібрані адреси мають бути від неї; локальний dev-сервер
 * лишається на `/`, інакше `.claude/launch.json` відкривав би порожню сторінку,
 * а браузерна перевірка — обовʼязкова частина роботи.
 *
 * `isPreview` тут не зайвий: для `vite preview` command дорівнює 'serve', тож
 * без нього preview піднімався б на `/`, а зібраний index.html просив би файли
 * з `/Code-Nature/` — і сервер мовчки віддавав би на кожен запит ту саму
 * сторінку-заглушку. Саме так і сталося при першій спробі: 200 на все, порожній
 * екран і Content-Type: text/html на JS.
 */
// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/Code-Nature/' : '/',
  plugins: [react(), sandboxAgent('src/sandbox/agent.ts'), spaFallback()],
}))
