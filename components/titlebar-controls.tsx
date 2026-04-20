"use client";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function TitlebarControls() {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <ThemeSwitcher />
      <LocaleSwitcher />
    </div>
  );
}
