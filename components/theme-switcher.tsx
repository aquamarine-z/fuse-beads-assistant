"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ThemeMode = "system" | "light" | "dark";
type AccentName =
  | "peach"
  | "teal"
  | "violet"
  | "amber"
  | "rose"
  | "blush"
  | "mint"
  | "sage";

const ACCENT_SWATCHES: Record<AccentName, string> = {
  peach: "#ef8b62",
  teal: "#3fa6b6",
  violet: "#8d63e6",
  amber: "#d8a12f",
  rose: "#df5f57",
  blush: "#de79ad",
  mint: "#4dbda5",
  sage: "#6ba57a",
};

export function ThemeSwitcher() {
  const t = useTranslations("ThemeSwitcher");
  const [mode, setMode] = useState<ThemeMode>("system");
  const [accent, setAccent] = useState<AccentName>("peach");

  useEffect(() => {
    const savedMode = window.localStorage.getItem("fuse-theme-mode");
    const savedAccent = window.localStorage.getItem("fuse-theme-accent");

    if (savedMode === "system" || savedMode === "light" || savedMode === "dark") {
      setMode(savedMode);
      applyTheme(savedMode);
    } else {
      applyTheme("system");
    }

    if (
      savedAccent === "peach" ||
      savedAccent === "teal" ||
      savedAccent === "violet" ||
      savedAccent === "amber" ||
      savedAccent === "rose" ||
      savedAccent === "blush" ||
      savedAccent === "mint" ||
      savedAccent === "sage"
    ) {
      setAccent(savedAccent);
      document.documentElement.dataset.accent = savedAccent;
    }
  }, []);

  function handleModeChange(nextMode: string | null) {
    if (!nextMode) {
      return;
    }

    const resolved = nextMode as ThemeMode;
    setMode(resolved);
    window.localStorage.setItem("fuse-theme-mode", resolved);
    applyTheme(resolved);
  }

  function handleAccentChange(nextAccent: string | null) {
    if (!nextAccent) {
      return;
    }

    const resolved = nextAccent as AccentName;
    setAccent(resolved);
    document.documentElement.dataset.accent = resolved;
    window.localStorage.setItem("fuse-theme-accent", resolved);
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <Select value={mode} onValueChange={handleModeChange}>
        <SelectTrigger aria-label={t("themeLabel")} className="min-w-32 rounded-2xl bg-background/75">
          <SelectValue>{t(mode)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="system">{t("system")}</SelectItem>
            <SelectItem value="light">{t("light")}</SelectItem>
            <SelectItem value="dark">{t("dark")}</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select value={accent} onValueChange={handleAccentChange}>
        <SelectTrigger aria-label={t("accentLabel")} className="min-w-32 rounded-2xl bg-background/75">
          <SelectValue>
            <span className="inline-flex items-center gap-2">
              <span
                className="size-3 rounded-full border border-black/10 shadow-sm"
                style={{ backgroundColor: ACCENT_SWATCHES[accent] }}
              />
              <span>{t(accent)}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="peach">
              <span className="inline-flex items-center gap-2">
                <span className="size-3 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: ACCENT_SWATCHES.peach }} />
                <span>{t("peach")}</span>
              </span>
            </SelectItem>
            <SelectItem value="teal">
              <span className="inline-flex items-center gap-2">
                <span className="size-3 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: ACCENT_SWATCHES.teal }} />
                <span>{t("teal")}</span>
              </span>
            </SelectItem>
            <SelectItem value="violet">
              <span className="inline-flex items-center gap-2">
                <span className="size-3 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: ACCENT_SWATCHES.violet }} />
                <span>{t("violet")}</span>
              </span>
            </SelectItem>
            <SelectItem value="amber">
              <span className="inline-flex items-center gap-2">
                <span className="size-3 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: ACCENT_SWATCHES.amber }} />
                <span>{t("amber")}</span>
              </span>
            </SelectItem>
            <SelectItem value="rose">
              <span className="inline-flex items-center gap-2">
                <span className="size-3 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: ACCENT_SWATCHES.rose }} />
                <span>{t("rose")}</span>
              </span>
            </SelectItem>
            <SelectItem value="blush">
              <span className="inline-flex items-center gap-2">
                <span className="size-3 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: ACCENT_SWATCHES.blush }} />
                <span>{t("blush")}</span>
              </span>
            </SelectItem>
            <SelectItem value="mint">
              <span className="inline-flex items-center gap-2">
                <span className="size-3 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: ACCENT_SWATCHES.mint }} />
                <span>{t("mint")}</span>
              </span>
            </SelectItem>
            <SelectItem value="sage">
              <span className="inline-flex items-center gap-2">
                <span className="size-3 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: ACCENT_SWATCHES.sage }} />
                <span>{t("sage")}</span>
              </span>
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = mode === "dark" || (mode === "system" && systemDark);

  root.classList.toggle("dark", isDark);
}
