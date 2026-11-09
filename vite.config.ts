import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

import { sandboxAgent } from './vite/sandboxAgent'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), sandboxAgent('src/sandbox/agent.ts')],
})
