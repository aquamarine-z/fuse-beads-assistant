"use client";

import {useEffect, useMemo, useState} from "react";
import {CheckCircle2, RefreshCw, WifiOff} from "lucide-react";
import {useTranslations} from "next-intl";

type PwaBannerState = "idle" | "offline-ready" | "offline";

export function PwaStatusPill() {
  const t = useTranslations("PwaStatus");
  const [isOffline, setIsOffline] = useState(false);
  const [isOfflineReady, setIsOfflineReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncOnlineStatus = () => {
      setIsOffline(!window.navigator.onLine);
    };

    syncOnlineStatus();

    const handleMessage = (event: MessageEvent<{type?: string}>) => {
      if (event.data?.type === "OFFLINE_READY") {
        setIsOfflineReady(true);
      }
    };

    window.addEventListener("online", syncOnlineStatus);
    window.addEventListener("offline", syncOnlineStatus);
    navigator.serviceWorker?.addEventListener("message", handleMessage);

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.ready.then(() => {
        setIsOfflineReady(true);
      });
    }

    return () => {
      window.removeEventListener("online", syncOnlineStatus);
      window.removeEventListener("offline", syncOnlineStatus);
      navigator.serviceWorker?.removeEventListener("message", handleMessage);
    };
  }, []);

  const state = useMemo<PwaBannerState>(() => {
    if (isOffline) {
      return "offline";
    }

    if (isOfflineReady) {
      return "offline-ready";
    }

    return "idle";
  }, [isOffline, isOfflineReady]);

  if (state === "idle") {
    return null;
  }

  const content =
    state === "offline"
      ? {
          icon: WifiOff,
          label: t("offlineLabel"),
          description: t("offlineDescription"),
          className:
            "border-amber-200/70 bg-[color-mix(in_oklab,var(--color-background)_78%,var(--color-amber-100)_22%)] text-[color-mix(in_oklab,var(--color-foreground)_84%,var(--color-amber-950)_16%)] dark:border-amber-300/18 dark:bg-[color-mix(in_oklab,var(--color-background)_72%,var(--color-amber-500)_10%)] dark:text-[color-mix(in_oklab,var(--color-foreground)_90%,white_10%)]",
        }
      : {
          icon: CheckCircle2,
          label: t("readyLabel"),
          description: t("readyDescription"),
          className:
            "border-emerald-200/70 bg-[color-mix(in_oklab,var(--color-background)_84%,var(--color-emerald-100)_16%)] text-[color-mix(in_oklab,var(--color-foreground)_88%,var(--color-emerald-900)_12%)] dark:border-emerald-300/16 dark:bg-[color-mix(in_oklab,var(--color-background)_76%,var(--color-emerald-500)_8%)] dark:text-[color-mix(in_oklab,var(--color-foreground)_92%,white_8%)]",
        };

  const Icon = content.icon;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[70] flex justify-center px-4 sm:top-4">
      <div
        className={`pointer-events-auto inline-flex max-w-[min(100%,44rem)] items-center gap-3 rounded-full border px-3 py-2 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.38)] backdrop-blur-xl sm:px-4 ${content.className}`}
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/65 shadow-[inset_0_1px_0_rgba(255,255,255,0.58)] dark:bg-white/10">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold sm:text-sm">{content.label}</p>
          <p className="text-[11px] leading-[1.25] text-current/78 sm:text-xs">{content.description}</p>
        </div>
        {state === "offline" ? (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-current/14 bg-white/60 px-2.5 py-1 text-[11px] font-medium text-current shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] transition hover:bg-white/80 dark:bg-white/10 dark:hover:bg-white/14"
          >
            <RefreshCw className="size-3" />
            {t("refresh")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
