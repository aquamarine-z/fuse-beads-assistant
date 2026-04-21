"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDownToLine, ArrowLeft, Palette } from "lucide-react";
import { useTranslations } from "next-intl";

import { ZoomableCanvasShell } from "@/components/zoomable-canvas-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TitlebarControls } from "@/components/titlebar-controls";
import { Link } from "@/i18n/navigation";
import {
  derivePatternExportCellSize,
  generatePatternFromImage,
  parsePaletteCsv,
  type PaletteColor,
  type PatternResult,
  renderPatternExportToCanvas,
} from "@/lib/bead-pattern";
import { readPatternImageFromIndexedDb } from "@/lib/pattern-image-store";
import {
  PATTERN_EXPORT_CHANNEL,
  PATTERN_STUDIO_STORAGE_KEY,
  type PatternStudioPersistedState,
  persistPatternStudioState,
} from "@/lib/pattern-studio-state";

export function PatternExportViewer() {
  const t = useTranslations("PatternExport");
  const [palette, setPalette] = useState<PaletteColor[]>([]);
  const [pattern, setPattern] = useState<PatternResult | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageTitle, setImageTitle] = useState("");
  const [sourceSummary, setSourceSummary] = useState("");
  const [targetWidth, setTargetWidth] = useState(52);
  const [targetHeight, setTargetHeight] = useState(52);
  const [imageAreaWidth, setImageAreaWidth] = useState(52);
  const [imageAreaHeight, setImageAreaHeight] = useState(52);
  const [showCodes, setShowCodes] = useState(true);
  const [persistedState, setPersistedState] = useState<PatternStudioPersistedState | null>(null);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(true);
  const [viewerModeActive, setViewerModeActive] = useState(false);
  const [viewerScale, setViewerScale] = useState(1);
  const [canvasDisplaySize, setCanvasDisplaySize] = useState({ width: 0, height: 0 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const exportCellSize = derivePatternExportCellSize(pattern);

  useEffect(() => {
    let active = true;

    fetch("/Mard221.csv")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unable to read palette file.");
        }

        return response.text();
      })
      .then((text) => {
        if (!active) {
          return;
        }

        setPalette(parsePaletteCsv(text));
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setError(t("missingData"));
        setIsPending(false);
      });

    return () => {
      active = false;
    };
  }, [t]);

  useEffect(() => {
    const sourceStudioId = new URLSearchParams(window.location.search).get("source");
    const saved = window.sessionStorage.getItem(PATTERN_STUDIO_STORAGE_KEY);
    let fallbackState: PatternStudioPersistedState | null = null;

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<PatternStudioPersistedState>;

        if (
          typeof parsed.targetWidth === "number" &&
          typeof parsed.targetHeight === "number" &&
          typeof parsed.imageAreaWidth === "number" &&
          typeof parsed.imageAreaHeight === "number" &&
          typeof parsed.fitMode === "string" &&
          typeof parsed.samplingMode === "string" &&
          typeof parsed.colorMergeTolerance === "number" &&
          typeof parsed.preferSquare === "boolean" &&
          typeof parsed.lockAspectRatio === "boolean" &&
          typeof parsed.lockImageAspectRatio === "boolean" &&
          typeof parsed.showCodes === "boolean" &&
          typeof parsed.cellSize === "number" &&
          typeof parsed.activeTab === "string" &&
          typeof parsed.imageStorageKey === "string" &&
          typeof parsed.imageTitle === "string" &&
          typeof parsed.sourceSummary === "string"
        ) {
          fallbackState = parsed as PatternStudioPersistedState;
        }
      } catch {
        // Ignore malformed same-tab state and wait for a fresh broadcast payload.
      }
    }

    if (!sourceStudioId) {
      if (fallbackState) {
        setPersistedState(fallbackState);
        setError("");
      } else {
        setError(t("missingData"));
        setIsPending(false);
      }

      return;
    }

    const channel = new BroadcastChannel(PATTERN_EXPORT_CHANNEL);
    let resolved = false;
    let attempt = 0;

    channel.onmessage = (event) => {
      if (event.data?.type === "provide-state" && event.data.payload?.imageUrl) {
        resolved = true;
        setImageUrl(event.data.payload.imageUrl as string);
        setPersistedState(event.data.payload as PatternStudioPersistedState);
        channel.close();
      }

      if (event.data?.type === "state-unavailable") {
        resolved = true;
        if (fallbackState) {
          setPersistedState(fallbackState);
          setError("");
        } else {
          setError(t("missingData"));
          setIsPending(false);
        }
        channel.close();
      }
    };

    const request = () => {
      if (resolved) {
        return;
      }

      attempt += 1;
      channel.postMessage({
        type: "request-state",
        sourceStudioId,
      });

      if (attempt >= 8) {
        resolved = true;
        if (fallbackState) {
          setPersistedState(fallbackState);
          setError("");
        } else {
          setError(t("missingData"));
          setIsPending(false);
        }
        channel.close();
        return;
      }

      window.setTimeout(request, 180);
    };

    request();

    return () => {
      channel.close();
    };
  }, [t]);

  useEffect(() => {
    if (!persistedState) {
      return;
    }

    setImageTitle(persistedState.imageTitle ?? "");
    setSourceSummary(persistedState.sourceSummary ?? "");
    setTargetWidth(persistedState.targetWidth);
    setTargetHeight(persistedState.targetHeight);
    setImageAreaWidth(persistedState.imageAreaWidth);
    setImageAreaHeight(persistedState.imageAreaHeight);
    setShowCodes(persistedState.showCodes ?? true);
    persistPatternStudioState({
      targetWidth: persistedState.targetWidth,
      targetHeight: persistedState.targetHeight,
      imageAreaWidth: persistedState.imageAreaWidth,
      imageAreaHeight: persistedState.imageAreaHeight,
      backgroundTag: persistedState.backgroundTag ?? "H1",
      fitMode: persistedState.fitMode,
      samplingMode: persistedState.samplingMode,
      colorMergeTolerance: persistedState.colorMergeTolerance,
      preferSquare: persistedState.preferSquare,
      lockAspectRatio: persistedState.lockAspectRatio,
      lockImageAspectRatio: persistedState.lockImageAspectRatio,
      showCodes: persistedState.showCodes,
      cellSize: persistedState.cellSize,
      activeTab: persistedState.activeTab,
      imageStorageKey: persistedState.imageStorageKey,
      imageTitle: persistedState.imageTitle,
      sourceSummary: persistedState.sourceSummary,
    });
    setError("");
  }, [persistedState]);

  useEffect(() => {
    let active = true;

    async function resolveImage() {
      if (!persistedState) {
        return;
      }

      if (imageUrl) {
        return;
      }

      if (!persistedState.imageStorageKey) {
        setError(t("missingData"));
        setIsPending(false);
        return;
      }

      const storedImageUrl = await readPatternImageFromIndexedDb(
        persistedState.imageStorageKey
      );

      if (!active) {
        return;
      }

      if (!storedImageUrl) {
        setError(t("missingData"));
        setIsPending(false);
        return;
      }

      setImageUrl(storedImageUrl);
    }

    void resolveImage();

    return () => {
      active = false;
    };
  }, [imageUrl, persistedState, t]);

  useEffect(() => {
    if (!imageUrl) {
      return;
    }

    const image = new window.Image();
    setIsPending(true);

    image.onload = () => {
      setSourceImage(image);
      setError("");
    };

    image.onerror = () => {
      setPattern(null);
      setSourceImage(null);
      setError(t("missingData"));
      setIsPending(false);
    };

    image.src = imageUrl;
  }, [imageUrl, t]);

  useEffect(() => {
    if (!persistedState || !sourceImage || !palette.length) {
      return;
    }

    setIsPending(true);

    try {
      const nextPattern = generatePatternFromImage(
        sourceImage,
        palette,
        persistedState.targetWidth,
        persistedState.targetHeight,
        persistedState.imageAreaWidth,
        persistedState.imageAreaHeight,
        persistedState.fitMode,
        persistedState.samplingMode,
        persistedState.colorMergeTolerance,
        persistedState.backgroundTag ?? "H1"
      );

      setPattern(nextPattern);
      setError("");
    } catch {
      setPattern(null);
      setError(t("missingData"));
    } finally {
      setIsPending(false);
    }
  }, [palette, persistedState, sourceImage, t]);

  useEffect(() => {
    if (!pattern || !canvasRef.current) {
      return;
    }

    renderPatternExportToCanvas(canvasRef.current, pattern, {
      cellSize: exportCellSize,
      showCodes,
      legendTitle: t("legendTitle"),
      legendTotalLabel: t("legendTotalColors", { count: pattern.counts.length }),
      beadUnit: t("beadUnit"),
      title: imageTitle,
      boardSizeLabel: t("boardSizeLabel"),
      imageAreaSizeLabel: t("imageAreaSizeLabel"),
      boardWidth: targetWidth,
      boardHeight: targetHeight,
      imageAreaWidth,
      imageAreaHeight,
    });

    setCanvasDisplaySize({
      width: canvasRef.current.width,
      height: canvasRef.current.height,
    });
  }, [exportCellSize, imageAreaHeight, imageAreaWidth, imageTitle, pattern, showCodes, t, targetHeight, targetWidth]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof HTMLElement)) {
        setViewerModeActive(false);
        return;
      }

      if (target.closest("[data-export-zoom-keep='true']")) {
        return;
      }

      if (!target.closest("[data-export-zoom-panel='true']")) {
        setViewerModeActive(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (!viewerModeActive) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
    };
  }, [viewerModeActive]);

  function handleViewerWheelZoom(event: React.WheelEvent<HTMLDivElement>) {
    if (!viewerModeActive) {
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    const delta = event.ctrlKey ? -event.deltaY * 0.0015 : -event.deltaY * 0.0008;
    setViewerScale((current) => Math.max(0.45, Math.min(2.4, current + delta)));
  }

  function handleDownload() {
    if (!canvasRef.current) {
      return;
    }

    const link = document.createElement("a");
    link.href = canvasRef.current.toDataURL("image/png");
    link.download = `${sanitizeFileNameSegment(imageTitle || t("untitledImage"))}-${sanitizeFileNameSegment(t("fileNameLargeExport"))}.png`;
    link.click();
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.9),transparent_40%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.65),transparent_30%),linear-gradient(180deg,var(--background),color-mix(in_oklab,var(--background),var(--primary)_8%))]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_20%_20%,color-mix(in_oklab,var(--primary),transparent_68%),transparent_35%),radial-gradient(circle_at_80%_0%,color-mix(in_oklab,var(--chart-2),transparent_65%),transparent_30%)] blur-3xl" />
      <section className="mx-auto flex w-full max-w-[min(100%,1900px)] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/pattern"
            className={buttonVariants({ variant: "outline", className: "rounded-2xl" })}
          >
            <ArrowLeft data-icon="inline-start" />
            {t("back")}
          </Link>
          <TitlebarControls />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/65 bg-white/72 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/8">
              <span>{t("eyebrow")}</span>
            </div>
            <div className="space-y-2">
              <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground/92 md:text-5xl">
                {t("title")}
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
                {t("description")}
              </p>
            </div>
            {(imageTitle || sourceSummary) ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className="font-medium text-foreground">
                  {imageTitle || t("untitledImage")}
                </span>
                {sourceSummary ? (
                  <span className="text-muted-foreground">{sourceSummary}</span>
                ) : null}
              </div>
            ) : null}
          </div>

          <div
            data-export-zoom-keep="true"
            className="flex flex-wrap items-center justify-start gap-2 rounded-[1.75rem] border border-white/60 bg-white/66 p-2 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/6"
          >
            <label className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background/80 px-3 py-2 text-sm">
              <Switch checked={showCodes} onCheckedChange={setShowCodes} />
              <span>{t("showCodesToggle")}</span>
            </label>
            <Button
              variant="outline"
              className="rounded-2xl"
              disabled={!imageUrl}
              onClick={() => window.open(imageUrl, "_blank", "noopener,noreferrer")}
            >
              {t("openSource")}
            </Button>
            <Button className="rounded-2xl" disabled={!pattern} onClick={handleDownload}>
              <ArrowDownToLine data-icon="inline-start" />
              {t("download")}
            </Button>
          </div>
        </div>

        <div className="relative w-full min-w-0">
          {pattern ? (
            <ZoomableCanvasShell
              active={viewerModeActive}
              panelId="export-viewer"
              activeHintTitle={t("viewerModeTitle")}
              activeHintDescription={t("viewerModeDescription")}
              keepActiveDataAttr="data-export-zoom-keep"
              panelDataAttr="data-export-zoom-panel"
              outerClassName="relative w-full min-w-0"
              clipClassName="relative w-full min-w-0 overflow-clip rounded-[2rem]"
              surfaceClassName={`relative w-full min-w-0 rounded-[2rem] border border-white/60 bg-white/68 shadow-[0_24px_64px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-colors dark:border-white/10 dark:bg-white/6 ${
                viewerModeActive ? "cursor-grab" : ""
              }`}
              scrollClassName="pattern-scroll-panel relative z-0 max-h-[calc(100vh-15rem)] overflow-auto p-4 md:p-5"
              borderIdleClassName="border-white/60 dark:border-white/10"
              borderActiveClassName="border-primary/55"
              pinchValue={viewerScale}
              pinchMin={0.45}
              pinchMax={2.4}
              onActiveChange={setViewerModeActive}
              onPinchValueChange={setViewerScale}
              onWheel={handleViewerWheelZoom}
            >
              <div
                className="mx-auto flex min-h-[24rem] min-w-full w-max items-start justify-center pt-6"
                style={{
                  width: canvasDisplaySize.width ? `${canvasDisplaySize.width * viewerScale}px` : undefined,
                  height: canvasDisplaySize.height ? `${canvasDisplaySize.height * viewerScale}px` : undefined,
                }}
              >
                <canvas
                  ref={canvasRef}
                  className="block max-w-none rounded-[1.5rem] shadow-[0_12px_32px_rgba(15,23,42,0.12)]"
                  style={{
                    width: canvasDisplaySize.width ? `${canvasDisplaySize.width * viewerScale}px` : undefined,
                    height: canvasDisplaySize.height ? `${canvasDisplaySize.height * viewerScale}px` : undefined,
                  }}
                />
              </div>
            </ZoomableCanvasShell>
          ) : (
            <div className="flex min-h-[24rem] items-center justify-center rounded-[2rem] border border-white/60 bg-white/68 p-4 shadow-[0_24px_64px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/6">
              <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-center">
                <div className="flex size-14 items-center justify-center rounded-[1.5rem] bg-secondary text-primary">
                  <Palette className="size-6" />
                </div>
                <p className="text-sm leading-7 text-muted-foreground">
                  {error || (isPending ? t("loading") : t("missingData"))}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function sanitizeFileNameSegment(value: string) {
  const sanitized = value
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return sanitized || "export";
}
