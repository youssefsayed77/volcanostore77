import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "volcano_theme";

export function useTheme() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === "dark";
    return true; // default dark
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove("theme-light");
      root.classList.add("theme-dark");
    } else {
      root.classList.remove("theme-dark");
      root.classList.add("theme-light");
    }
    localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
  }, [isDark]);

  const toggleTheme = useCallback(() => setIsDark((d) => !d), []);

  return { isDark, toggleTheme } as const;
}
