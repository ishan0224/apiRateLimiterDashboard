"use client";

import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "dark" | "light";

const THEME_STORAGE_KEY = "api-rate-limiter-theme";

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
}

function readStoredTheme(): ThemeMode | null {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (stored === "dark" || stored === "light") {
    return stored;
  }

  return null;
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof document !== "undefined") {
      const initial = document.documentElement.dataset.theme;

      if (initial === "dark" || initial === "light") {
        return initial;
      }
    }

    return "dark";
  });

  useEffect(() => {
    const stored = readStoredTheme();
    const next = stored ?? "dark";

    if (theme !== next) {
      setTheme(next);
      applyTheme(next);
    }
  }, [theme]);

  const updateTheme = useCallback((nextTheme: ThemeMode) => {
    setTheme(nextTheme);
    applyTheme(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    updateTheme(theme === "dark" ? "light" : "dark");
  }, [theme, updateTheme]);

  return {
    theme,
    isDark: theme === "dark",
    setTheme: updateTheme,
    toggleTheme,
  };
}
