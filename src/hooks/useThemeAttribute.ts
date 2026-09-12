import { useEffect } from "react";
import { useSelector } from "react-redux";

import { selectTheme } from "../store/slices/themeSlice";

/**
 * Проставляє `data-theme` на <html> і запамʼятовує вибір.
 *
 * Саме на цей атрибут спираються токени в `_variables.scss` — уся зміна теми
 * зводиться до перевизначення кількох CSS-змінних, компоненти не чіпаються.
 */
export function useThemeAttribute() {
  const theme = useSelector(selectTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("theme_v1", theme);
    } catch {
      // приватний режим або заблоковане сховище — тема просто не запамʼятається
    }
  }, [theme]);
}
