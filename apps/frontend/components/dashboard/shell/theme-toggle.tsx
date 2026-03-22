"use client";

import { MoonStar, SunMedium } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <Button variant="ghost" onClick={toggleTheme} aria-label="Toggle theme" title="Toggle theme">
      {isDark ? <SunMedium className="h-4 w-4" aria-hidden="true" /> : <MoonStar className="h-4 w-4" aria-hidden="true" />}
      {isDark ? "Light" : "Dark"}
    </Button>
  );
}
