/// <reference types="vite/client" />

/**
 * Агент пісочниці, зібраний у рядок плагіном `vite/sandboxAgent.ts`.
 * Потрапляє в `srcdoc` інлайном: у пісочниці чужий origin, і завантажити
 * скрипт із нашого домену вона не може — це і є сенс ізоляції.
 */
declare module "virtual:sandbox-agent" {
  const agentSource: string;
  export default agentSource;
}
