"use client";

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowDownToLine,
  Droplets,
  ImagePlus,
  LayoutGrid,
  Palette,
  RefreshCw,
  ScanSearch,
  Sparkles,
  SwatchBook,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TitlebarControls } from "@/components/titlebar-controls";
import { Link } from "@/i18n/navigation";
import {
  type FitMode,
  type PaletteColor,
  type PatternResult,
  type SamplingMode,
  generatePatternFromImage,
  parsePaletteCsv,
  renderPatternToCanvas,
} from "@/lib/bead-pattern";
import {
  readPatternImageFromIndexedDb,
  savePatternImageToIndexedDb,
} from "@/lib/pattern-image-store";
import {
  PATTERN_EXPORT_CHANNEL,
  PATTERN_STUDIO_ID_KEY,
  PATTERN_STUDIO_STORAGE_KEY,
  type PatternExportTransferState,
  type PatternStudioPersistedState,
  persistPatternStudioState,
} from "@/lib/pattern-studio-state";
import { useTranslations } from "next-intl";

const FIT_MODES: Array<{ value: FitMode; key: "Contain" | "Cover" | "Stretch" }> = [
  { value: "contain", key: "Contain" },
  { value: "cover", key: "Cover" },
  { value: "stretch", key: "Stretch" },
];

const SAMPLING_MODES: Array<{ value: SamplingMode; key: "Smooth" | "Precise" }> = [
  { value: "smooth", key: "Smooth" },
  { value: "precise", key: "Precise" },
];

const BOARD_PRESETS = [
  { value: "52x52", width: 52, height: 52 },
  { value: "104x104", width: 104, height: 104 },
  { value: "52x104", width: 52, height: 104 },
  { value: "104x52", width: 104, height: 52 },
];

const MIN_CELL_SIZE = 8;
const MAX_CELL_SIZE = 32;

export function PatternStudio() {
  const t = useTranslations("PatternStudio");
  const [palette, setPalette] = useState<PaletteColor[]>([]);
  const [paletteError, setPaletteError] = useState("");
  const [targetWidth, setTargetWidth] = useState(52);
  const [targetHeight, setTargetHeight] = useState(52);
  const [imageAreaWidth, setImageAreaWidth] = useState(52);
  const [imageAreaHeight, setImageAreaHeight] = useState(52);
  const [fitMode, setFitMode] = useState<FitMode>("contain");
  const [samplingMode, setSamplingMode] = useState<SamplingMode>("smooth");
  const [colorMergeTolerance, setColorMergeTolerance] = useState(0);
  const [preferSquare, setPreferSquare] = useState(true);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [lockImageAspectRatio, setLockImageAspectRatio] = useState(true);
  const [showCodes, setShowCodes] = useState(true);
  const [cellSize, setCellSize] = useState(24);
  const [activeTab, setActiveTab] = useState("preview");
  const [imageUrl, setImageUrl] = useState("");
  const [imageStorageKey, setImageStorageKey] = useState("");
  const [imageTitle, setImageTitle] = useState("");
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [sourceSummary, setSourceSummary] = useState("");
  const [pattern, setPattern] = useState<PatternResult | null>(null);
  const [patternKey, setPatternKey] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [processingError, setProcessingError] = useState("");
  const [isStateRestored, setIsStateRestored] = useState(false);
  const [lastEditedAxis, setLastEditedAxis] = useState<"width" | "height">("width");
  const [lastEditedImageAxis, setLastEditedImageAxis] = useState<"width" | "height">("width");
  const [isDragActive, setIsDragActive] = useState(false);
  const [zoomActivePanel, setZoomActivePanel] = useState<"preview" | "plan" | "plan-colors" | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const planCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const planWithColorsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const deferredPattern = useDeferredValue(pattern);
  const exportStateRef = useRef<PatternExportTransferState | null>(null);
  const studioIdRef = useRef("");
  const currentPatternKey = useMemo(
    () =>
      [
        imageUrl,
        targetWidth,
        targetHeight,
        imageAreaWidth,
        imageAreaHeight,
        fitMode,
        samplingMode,
        colorMergeTolerance,
      ].join("|"),
    [colorMergeTolerance, fitMode, imageAreaHeight, imageAreaWidth, imageUrl, samplingMode, targetHeight, targetWidth]
  );
  const isPatternReadyForExport =
    Boolean(imageUrl) &&
    Boolean(deferredPattern) &&
    patternKey === currentPatternKey;
  const planCellSize = useMemo(() => cellSize + 4, [cellSize]);

  const allColors = useMemo(() => deferredPattern?.counts ?? [], [deferredPattern]);

  function handleWorkspaceTabChange(value: string) {
    const wasZoomActive = zoomActivePanel !== null;
    setActiveTab(value);

    if (
      wasZoomActive &&
      (value === "preview" || value === "plan" || value === "plan-colors")
    ) {
      setZoomActivePanel(value as "preview" | "plan" | "plan-colors");
      return;
    }

    if (value === "source") {
      setZoomActivePanel(null);
    }
  }

  function buildExportFileName(kind: "preview" | "chart") {
    const baseName = sanitizeFileNameSegment(imageTitle || t("untitledImage"));
    const suffix = sanitizeFileNameSegment(
      kind === "preview" ? t("fileNamePreview") : t("fileNameChart")
    );

    return `${baseName}-${suffix}.png`;
  }

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

        setPaletteError(t("paletteLoadError"));
      });

    return () => {
      active = false;
    };
  }, [t]);

  useEffect(() => {
    const existingStudioId = window.sessionStorage.getItem(PATTERN_STUDIO_ID_KEY);
    const studioId = existingStudioId || crypto.randomUUID();
    studioIdRef.current = studioId;
    setImageStorageKey(`pattern-image:${studioId}`);

    if (!existingStudioId) {
      window.sessionStorage.setItem(PATTERN_STUDIO_ID_KEY, studioId);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function restoreState() {
      const saved = window.sessionStorage.getItem(PATTERN_STUDIO_STORAGE_KEY);

      if (!saved) {
        setIsStateRestored(true);
        return;
      }

      try {
        const parsed = JSON.parse(saved) as Partial<PatternStudioPersistedState>;

        if (parsed.targetWidth) setTargetWidth(parsed.targetWidth);
        if (parsed.targetHeight) setTargetHeight(parsed.targetHeight);
        if (parsed.imageAreaWidth) setImageAreaWidth(parsed.imageAreaWidth);
        if (parsed.imageAreaHeight) setImageAreaHeight(parsed.imageAreaHeight);
        if (parsed.fitMode) setFitMode(parsed.fitMode);
        if (parsed.samplingMode) setSamplingMode(parsed.samplingMode);
        if (typeof parsed.colorMergeTolerance === "number") {
          setColorMergeTolerance(parsed.colorMergeTolerance);
        }
        if (typeof parsed.preferSquare === "boolean") setPreferSquare(parsed.preferSquare);
        if (typeof parsed.lockAspectRatio === "boolean") setLockAspectRatio(parsed.lockAspectRatio);
        if (typeof parsed.lockImageAspectRatio === "boolean") {
          setLockImageAspectRatio(parsed.lockImageAspectRatio);
        }
        if (typeof parsed.showCodes === "boolean") setShowCodes(parsed.showCodes);
        if (typeof parsed.cellSize === "number") setCellSize(parsed.cellSize);
        if (parsed.activeTab) setActiveTab(parsed.activeTab);
        if (parsed.imageStorageKey) setImageStorageKey(parsed.imageStorageKey);
        if (parsed.imageTitle) setImageTitle(parsed.imageTitle);
        if (parsed.sourceSummary) setSourceSummary(parsed.sourceSummary);
        if (parsed.imageStorageKey) {
          const storedImageUrl = await readPatternImageFromIndexedDb(parsed.imageStorageKey);

          if (!active || !storedImageUrl) {
            return;
          }

          hydrateImage(storedImageUrl, parsed.sourceSummary ?? "", {
            targetWidth: parsed.targetWidth ?? 52,
            targetHeight: parsed.targetHeight ?? 52,
            imageAreaWidth: parsed.imageAreaWidth ?? 52,
            imageAreaHeight: parsed.imageAreaHeight ?? 52,
            preferSquare: parsed.preferSquare ?? true,
            lockAspectRatio: parsed.lockAspectRatio ?? true,
            lockImageAspectRatio: parsed.lockImageAspectRatio ?? true,
          }, parsed.imageStorageKey);
        }
      } catch {
        window.sessionStorage.removeItem(PATTERN_STUDIO_STORAGE_KEY);
      } finally {
        if (active) {
          setIsStateRestored(true);
        }
      }
    }

    void restoreState();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isStateRestored) {
      return;
    }

    const nextState: PatternStudioPersistedState = {
      targetWidth,
      targetHeight,
      imageAreaWidth,
      imageAreaHeight,
      fitMode,
      samplingMode,
      colorMergeTolerance,
      preferSquare,
      lockAspectRatio,
      lockImageAspectRatio,
      showCodes,
      cellSize,
      activeTab,
      imageStorageKey,
      imageTitle,
      sourceSummary,
    };

    persistPatternStudioState(nextState);

    if (patternKey === currentPatternKey && pattern && imageUrl) {
      exportStateRef.current = {
        exportKey: currentPatternKey,
        ...nextState,
        imageUrl,
      };
    } else {
      exportStateRef.current = null;
    }
  }, [
    activeTab,
    cellSize,
    colorMergeTolerance,
    fitMode,
    imageAreaHeight,
    imageAreaWidth,
    imageStorageKey,
    imageTitle,
    lockAspectRatio,
    lockImageAspectRatio,
    pattern,
    patternKey,
    preferSquare,
    samplingMode,
    showCodes,
    sourceSummary,
    targetHeight,
    targetWidth,
    isStateRestored,
  ]);

  useEffect(() => {
    const channel = new BroadcastChannel(PATTERN_EXPORT_CHANNEL);

    channel.onmessage = (event) => {
      if (
        event.data?.type !== "request-state" ||
        !event.data?.sourceStudioId ||
        event.data.sourceStudioId !== studioIdRef.current
      ) {
        return;
      }

      const nextState = exportStateRef.current;

      if (!nextState || !nextState.imageUrl) {
        channel.postMessage({ type: "state-unavailable" });
        return;
      }

      channel.postMessage({
        type: "provide-state",
        payload: nextState,
      });
    };

    return () => {
      channel.close();
    };
  }, []);

  useEffect(() => {
    if (!sourceImage || !palette.length) {
      return;
    }

    if (targetWidth < 1 || targetHeight < 1) {
      return;
    }

    setIsPending(true);
    setProcessingError("");

    const handle = window.setTimeout(() => {
      startTransition(() => {
        try {
          const nextPattern = generatePatternFromImage(
            sourceImage,
            palette,
            targetWidth,
            targetHeight,
            imageAreaWidth,
            imageAreaHeight,
            fitMode,
            samplingMode,
            colorMergeTolerance,
            "H2"
          );

          setPattern(nextPattern);
          setPatternKey(currentPatternKey);
        } catch {
          setProcessingError(t("generationError"));
        } finally {
          setIsPending(false);
        }
      });
    }, 40);

    return () => {
      window.clearTimeout(handle);
    };
  }, [colorMergeTolerance, currentPatternKey, fitMode, imageAreaHeight, imageAreaWidth, palette, samplingMode, sourceImage, targetHeight, targetWidth, t]);

  const drawCanvas = useEffectEvent(() => {
    if (!deferredPattern) {
      return;
    }

    if (previewCanvasRef.current) {
      renderPatternToCanvas(previewCanvasRef.current, deferredPattern, {
        cellSize,
        showCodes: false,
        showGrid: false,
      });
    }

    if (planCanvasRef.current) {
      renderPatternToCanvas(planCanvasRef.current, deferredPattern, {
        cellSize: planCellSize,
        showCodes,
        showGrid: true,
      });
    }

    if (planWithColorsCanvasRef.current) {
      renderPatternToCanvas(planWithColorsCanvasRef.current, deferredPattern, {
        cellSize: planCellSize,
        showCodes,
        showGrid: true,
      });
    }
  });

  useEffect(() => {
    drawCanvas();
  }, [activeTab, cellSize, deferredPattern, drawCanvas, planCellSize, showCodes]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof HTMLElement)) {
        setZoomActivePanel(null);
        return;
      }

      if (target.closest("[data-zoom-keep='true']")) {
        return;
      }

      if (!target.closest("[data-zoom-panel='true']")) {
        setZoomActivePanel(null);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (!zoomActivePanel) {
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
  }, [zoomActivePanel]);

  function handleFileSelect(file: File | null) {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setProcessingError(t("imageReadError"));
      return;
    }

    const reader = new window.FileReader();
    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        setProcessingError(t("imageReadError"));
        return;
      }

      hydrateImage(result);
    };
    reader.onerror = () => {
      setProcessingError(t("imageReadError"));
    };
    reader.readAsDataURL(file);
  }

  function handleDropImport(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(false);

    const file = Array.from(event.dataTransfer.files).find((item) =>
      item.type.startsWith("image/")
    );

    if (!file) {
      setProcessingError(t("imageReadError"));
      return;
    }

    handleFileSelect(file);
  }

  function handleCanvasWheelZoom(event: React.WheelEvent<HTMLDivElement>) {
    const panel = event.currentTarget.dataset.zoomPanelId as
      | "preview"
      | "plan"
      | "plan-colors"
      | undefined;

    if (!panel || zoomActivePanel !== panel) {
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    const delta = event.ctrlKey
      ? -event.deltaY * 0.08
      : -event.deltaY * 0.03;

    const step = delta > 0 ? Math.max(1, Math.round(delta)) : Math.min(-1, Math.round(delta));

    setCellSize((current) =>
      Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, current + step))
    );
  }

  function parsePositiveIntegerInput(value: string) {
    if (!value.trim()) {
      return null;
    }

    const nextValue = Number(value);

    if (!Number.isFinite(nextValue)) {
      return null;
    }

    return Math.max(1, Math.round(nextValue));
  }

  function getLargestCoveredImageArea(
    boardWidth: number,
    boardHeight: number,
    sourceRatio: number
  ) {
    if (!Number.isFinite(sourceRatio) || sourceRatio <= 0) {
      return {
        width: boardWidth,
        height: boardHeight,
      };
    }

    const widthUsingFullHeight = Math.max(
      1,
      Math.min(boardWidth, Math.round(boardHeight * sourceRatio))
    );
    const heightUsingFullWidth = Math.max(
      1,
      Math.min(boardHeight, Math.round(boardWidth / sourceRatio))
    );

    if (widthUsingFullHeight * boardHeight >= boardWidth * heightUsingFullWidth) {
      return {
        width: widthUsingFullHeight,
        height: boardHeight,
      };
    }

    return {
      width: boardWidth,
      height: heightUsingFullWidth,
    };
  }

  function syncImageAreaWithBoard(
    nextBoardWidth: number,
    nextBoardHeight: number,
    previousBoardWidth: number,
    previousBoardHeight: number
  ) {
    if (fitMode === "stretch") {
      setImageAreaWidth(nextBoardWidth);
      setImageAreaHeight(nextBoardHeight);
      return;
    }

    if (lockImageAspectRatio && sourceImage) {
      const sourceRatio = sourceImage.naturalWidth / sourceImage.naturalHeight;
      const nextImageArea = getLargestCoveredImageArea(
        nextBoardWidth,
        nextBoardHeight,
        sourceRatio
      );

      setImageAreaWidth(nextImageArea.width);
      setImageAreaHeight(nextImageArea.height);
      return;
    }

    const safePreviousBoardWidth = Math.max(1, previousBoardWidth);
    const safePreviousBoardHeight = Math.max(1, previousBoardHeight);
    const widthScale = nextBoardWidth / safePreviousBoardWidth;
    const heightScale = nextBoardHeight / safePreviousBoardHeight;

    setImageAreaWidth((current) =>
      Math.max(1, Math.min(nextBoardWidth, Math.round(current * widthScale)))
    );
    setImageAreaHeight((current) =>
      Math.max(1, Math.min(nextBoardHeight, Math.round(current * heightScale)))
    );
  }

  function updateDimension(axis: "width" | "height", value: number) {
    const safeValue = Number.isFinite(value) ? Math.max(1, Math.round(value)) : 1;
    setLastEditedAxis(axis);

    if (preferSquare) {
      const previousBoardWidth = targetWidth;
      const previousBoardHeight = targetHeight;
      setTargetWidth(safeValue);
      setTargetHeight(safeValue);
      syncImageAreaWithBoard(
        safeValue,
        safeValue,
        previousBoardWidth,
        previousBoardHeight
      );
      return;
    }

    let nextBoardWidth = axis === "width" ? safeValue : targetWidth;
    let nextBoardHeight = axis === "height" ? safeValue : targetHeight;

    if (axis === "width") {
      setTargetWidth(safeValue);
    } else {
      setTargetHeight(safeValue);
    }

    if (!lockAspectRatio || !sourceImage) {
      syncImageAreaWithBoard(nextBoardWidth, nextBoardHeight, targetWidth, targetHeight);
      return;
    }

    const ratio = sourceImage.naturalWidth / sourceImage.naturalHeight;

    if (axis === "width") {
      nextBoardHeight = Math.max(1, Math.round(safeValue / ratio));
      setTargetHeight(nextBoardHeight);
    } else {
      nextBoardWidth = Math.max(1, Math.round(safeValue * ratio));
      setTargetWidth(nextBoardWidth);
    }

    syncImageAreaWithBoard(nextBoardWidth, nextBoardHeight, targetWidth, targetHeight);
  }

  function updateImageAreaDimension(axis: "width" | "height", value: number) {
    const boardLimit = axis === "width" ? targetWidth : targetHeight;
    const safeValue = Number.isFinite(value)
      ? Math.min(boardLimit, Math.max(0, value))
      : 0;
    setLastEditedImageAxis(axis);

    if (axis === "width") {
      setImageAreaWidth(safeValue);
    } else {
      setImageAreaHeight(safeValue);
    }

    if (!lockImageAspectRatio || !sourceImage) {
      return;
    }

    const ratio = sourceImage.naturalWidth / sourceImage.naturalHeight;

    if (axis === "width") {
      setImageAreaHeight(Math.max(0, Math.min(targetHeight, Math.round(safeValue / ratio))));
    } else {
      setImageAreaWidth(Math.max(0, Math.min(targetWidth, Math.round(safeValue * ratio))));
    }
  }

  function handlePreferSquareToggle(checked: boolean) {
    setPreferSquare(checked);

    if (checked) {
      const squareSize = Math.max(targetWidth, targetHeight);
      const previousBoardWidth = targetWidth;
      const previousBoardHeight = targetHeight;
      setTargetWidth(squareSize);
      setTargetHeight(squareSize);
      syncImageAreaWithBoard(
        squareSize,
        squareSize,
        previousBoardWidth,
        previousBoardHeight
      );
    }
  }

  function handleAspectRatioToggle(checked: boolean) {
    setLockAspectRatio(checked);

    if (!checked || !sourceImage) {
      return;
    }

    const ratio = sourceImage.naturalWidth / sourceImage.naturalHeight;
    let nextBoardWidth = targetWidth;
    let nextBoardHeight = targetHeight;

    if (lastEditedAxis === "width") {
      nextBoardHeight = Math.max(1, Math.round(targetWidth / ratio));
      setTargetHeight(nextBoardHeight);
    } else {
      nextBoardWidth = Math.max(1, Math.round(targetHeight * ratio));
      setTargetWidth(nextBoardWidth);
    }

    syncImageAreaWithBoard(nextBoardWidth, nextBoardHeight, targetWidth, targetHeight);
  }

  function handleImageAspectRatioToggle(checked: boolean) {
    setLockImageAspectRatio(checked);

    if (!checked || !sourceImage) {
      return;
    }

    const ratio = sourceImage.naturalWidth / sourceImage.naturalHeight;

    if (lastEditedImageAxis === "width") {
      setImageAreaHeight(Math.max(0, Math.min(targetHeight, Math.round(imageAreaWidth / ratio))));
    } else {
      setImageAreaWidth(Math.max(0, Math.min(targetWidth, Math.round(imageAreaHeight * ratio))));
    }
  }

  function handleBoardPresetChange(value: string[]) {
    const preset = BOARD_PRESETS.find((item) => item.value === value[0]);

    if (!preset) {
      return;
    }

    const previousBoardWidth = targetWidth;
    const previousBoardHeight = targetHeight;
    setTargetWidth(preset.width);
    setTargetHeight(preset.height);
    setPreferSquare(preset.width === preset.height);
    syncImageAreaWithBoard(
      preset.width,
      preset.height,
      previousBoardWidth,
      previousBoardHeight
    );
  }

  function downloadCanvas(canvas: HTMLCanvasElement | null, fileName: string) {
    if (!canvas) {
      return;
    }

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = fileName;
    link.click();
  }

  function downloadPatternImage(options: {
    fileName: string;
    cellSize: number;
    showCodes: boolean;
    showGrid: boolean;
  }) {
    if (!deferredPattern) {
      return;
    }

    const exportCanvas = document.createElement("canvas");
    renderPatternToCanvas(exportCanvas, deferredPattern, {
      cellSize: options.cellSize,
      showCodes: options.showCodes,
      showGrid: options.showGrid,
    });

    downloadCanvas(exportCanvas, options.fileName);
  }

  function hydrateImage(
    dataUrl: string,
    restoredSummary?: string,
    restoredConfig?: {
      targetWidth: number;
      targetHeight: number;
      imageAreaWidth: number;
      imageAreaHeight: number;
      preferSquare: boolean;
      lockAspectRatio: boolean;
      lockImageAspectRatio: boolean;
    },
    restoredStorageKey?: string
  ) {
    const image = new window.Image();

    image.onload = () => {
      const nextImageStorageKey =
        restoredStorageKey || imageStorageKey || `pattern-image:${studioIdRef.current || crypto.randomUUID()}`;
      const summary = restoredSummary || `${image.naturalWidth} x ${image.naturalHeight}px`;
      const sourceRatio = image.naturalWidth / image.naturalHeight;
      const isRestoring = Boolean(restoredConfig);
      const nextTargetWidth = restoredConfig?.targetWidth ?? targetWidth;
      const nextTargetHeight = restoredConfig?.targetHeight ?? targetHeight;
      const nextImageAreaWidth = restoredConfig?.imageAreaWidth ?? imageAreaWidth;
      const nextImageAreaHeight = restoredConfig?.imageAreaHeight ?? imageAreaHeight;
      const nextPreferSquare = restoredConfig?.preferSquare ?? preferSquare;
      const nextLockAspectRatio = restoredConfig?.lockAspectRatio ?? lockAspectRatio;
      const nextLockImageAspectRatio =
        restoredConfig?.lockImageAspectRatio ?? lockImageAspectRatio;

      const nextBoardWidth = nextTargetWidth;
      const nextBoardHeight = isRestoring
        ? nextTargetHeight
        : nextPreferSquare
          ? nextTargetWidth
          : nextLockAspectRatio
            ? Math.max(1, Math.round(nextTargetWidth / sourceRatio))
            : nextTargetHeight;
      const nextImageWidth = Math.max(1, Math.min(nextBoardWidth, nextImageAreaWidth));
      const nextImageHeight = isRestoring
        ? Math.max(1, Math.min(nextBoardHeight, nextImageAreaHeight))
        : nextLockImageAspectRatio
          ? Math.max(1, Math.min(nextBoardHeight, Math.round(nextImageWidth / sourceRatio)))
          : Math.max(1, Math.min(nextBoardHeight, nextImageAreaHeight));

      setImageUrl(dataUrl);
      setImageStorageKey(nextImageStorageKey);
      setSourceImage(image);
      setPattern(null);
      setPatternKey("");
      setProcessingError("");
      setSourceSummary(summary);
      setTargetWidth(nextBoardWidth);
      setTargetHeight(nextBoardHeight);
      setImageAreaWidth(Math.min(nextBoardWidth, nextImageWidth));
      setImageAreaHeight(Math.min(nextBoardHeight, nextImageHeight));
      void savePatternImageToIndexedDb(nextImageStorageKey, dataUrl);
    };

    image.onerror = () => {
      setProcessingError(t("imageReadError"));
    };

    image.src = dataUrl;
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.9),transparent_40%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.65),transparent_30%),linear-gradient(180deg,var(--background),color-mix(in_oklab,var(--background),var(--primary)_8%))]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_20%_20%,color-mix(in_oklab,var(--primary),transparent_68%),transparent_35%),radial-gradient(circle_at_80%_0%,color-mix(in_oklab,var(--chart-2),transparent_65%),transparent_30%)] blur-3xl" />

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <Link
            href="/"
            className={buttonVariants({ variant: "outline", className: "w-full rounded-2xl sm:w-auto" })}
          >
            {t("eyebrow")}
          </Link>
          <TitlebarControls />
        </div>
        <header className="grid gap-5 rounded-[2rem] border border-white/60 bg-white/70 p-4 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:p-5 md:gap-6 md:p-7">
          <div className="flex flex-col gap-5">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-sm text-muted-foreground shadow-sm dark:border-white/10 dark:bg-white/5">
              <Sparkles className="size-4 text-primary" />
              {t("eyebrow")}
            </div>
            <div className="flex max-w-3xl flex-col gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-balance text-foreground/90 sm:text-4xl md:text-6xl">
                <span className="font-heading">{t("title")}</span>
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7 md:text-lg">
                {t("description")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                {t("paletteBadge", {count: palette.length || 221})}
              </Badge>
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                {t("sizeBadge")}
              </Badge>
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                {t("previewBadge")}
              </Badge>
            </div>
          </div>
        </header>

        <div className="grid items-start gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <Card className="min-w-0 rounded-[2rem] border-white/60 bg-white/70 shadow-[0_24px_64px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <CardHeader className="gap-2">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <ImagePlus className="text-primary" />
                {t("settingsTitle")}
              </CardTitle>
              <CardDescription>{t("settingsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="relative overflow-hidden rounded-[1.75rem] border border-dashed border-border/80 bg-background/80 p-4">
                <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{t("uploadTitle")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("uploadDesc")}
                      </p>
                    </div>
                    {sourceSummary ? <Badge variant="secondary">{sourceSummary}</Badge> : null}
                  </div>
                  <div className="grid gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(event) => handleFileSelect(event.target.files?.[0] ?? null)}
                    />
                    <Button
                      size="lg"
                      className="w-full rounded-2xl"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {imageUrl ? (
                        <RefreshCw data-icon="inline-start" />
                      ) : (
                        <ImagePlus data-icon="inline-start" />
                      )}
                      {imageUrl ? t("reimportImage") : t("selectImage")}
                    </Button>
                    <p className="text-xs leading-6 text-muted-foreground">
                      {t("uploadHint")}
                    </p>
                  </div>
                  <Field orientation="responsive">
                    <FieldLabel htmlFor="image-title">{t("imageTitleLabel")}</FieldLabel>
                    <FieldContent>
                      <Input
                        id="image-title"
                        value={imageTitle}
                        placeholder={t("imageTitlePlaceholder")}
                        onChange={(event) => setImageTitle(event.target.value)}
                      />
                      <FieldDescription>{t("imageTitleHint")}</FieldDescription>
                    </FieldContent>
                  </Field>
                </div>
              </div>

              <FieldGroup>
                <Field orientation="responsive">
                  <FieldLabel>{t("colorMergeToleranceLabel")}</FieldLabel>
                  <FieldContent>
                    <div className="grid gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-muted-foreground">{t("colorMergeToleranceMin")}</span>
                        <Badge variant="secondary" className="rounded-full px-3 py-1">
                          {colorMergeTolerance}
                        </Badge>
                      </div>
                      <Slider
                        value={[colorMergeTolerance]}
                        min={0}
                        max={30}
                        step={1}
                        onValueChange={(value) =>
                          setColorMergeTolerance(
                            typeof value === "number" ? value : (value[0] ?? 0)
                          )
                        }
                      />
                    </div>
                    <FieldDescription>{t("colorMergeToleranceHint")}</FieldDescription>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel>{t("boardPresets")}</FieldLabel>
                  <FieldContent>
                    <ToggleGroup
                      value={[`${targetWidth}x${targetHeight}`]}
                      onValueChange={handleBoardPresetChange}
                      className="grid w-full grid-cols-2 gap-2 md:grid-cols-4"
                      spacing={2}
                    >
                      {BOARD_PRESETS.map((preset) => (
                        <ToggleGroupItem
                          key={preset.value}
                          value={preset.value}
                          className="rounded-2xl"
                        >
                          {preset.value}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                    <FieldDescription>{t("boardPresetsHint")}</FieldDescription>
                  </FieldContent>
                </Field>

                <Field orientation="responsive">
                  <FieldLabel htmlFor="target-width">{t("widthLabel")}</FieldLabel>
                  <FieldContent>
                    <Input
                      id="target-width"
                      type="number"
                      min={1}
                      value={targetWidth}
                      onChange={(event) => {
                        const nextValue = parsePositiveIntegerInput(event.target.value);

                        if (nextValue === null) {
                          return;
                        }

                        updateDimension("width", nextValue);
                      }}
                    />
                    <FieldDescription>{t("widthHint")}</FieldDescription>
                  </FieldContent>
                </Field>

                <Field orientation="responsive">
                  <FieldLabel htmlFor="target-height">{t("heightLabel")}</FieldLabel>
                  <FieldContent>
                    <Input
                      id="target-height"
                      type="number"
                      min={1}
                      value={targetHeight}
                      disabled={preferSquare}
                      onChange={(event) => {
                        const nextValue = parsePositiveIntegerInput(event.target.value);

                        if (nextValue === null) {
                          return;
                        }

                        updateDimension("height", nextValue);
                      }}
                    />
                    <FieldDescription>
                      {preferSquare ? t("heightSquareHint") : t("heightHint")}
                    </FieldDescription>
                  </FieldContent>
                </Field>

                <Field orientation="horizontal">
                  <FieldLabel htmlFor="prefer-square">{t("preferSquare")}</FieldLabel>
                  <Switch
                    id="prefer-square"
                    checked={preferSquare}
                    onCheckedChange={handlePreferSquareToggle}
                  />
                </Field>

                <Field orientation="responsive">
                  <FieldLabel htmlFor="image-area-width">{t("imageAreaWidth")}</FieldLabel>
                  <FieldContent>
                    <div className="grid gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-muted-foreground">0</span>
                        <Badge variant="secondary" className="rounded-full px-3 py-1">
                          {imageAreaWidth} / {targetWidth}
                        </Badge>
                      </div>
                      <Slider
                        value={[imageAreaWidth]}
                        min={0}
                        max={targetWidth}
                        step={1}
                        onValueChange={(value) =>
                          updateImageAreaDimension(
                            "width",
                            typeof value === "number" ? value : (value[0] ?? 0)
                          )
                        }
                      />
                    </div>
                    <FieldDescription>{t("imageAreaWidthHint")}</FieldDescription>
                  </FieldContent>
                </Field>

                <Field orientation="responsive">
                  <FieldLabel htmlFor="image-area-height">{t("imageAreaHeight")}</FieldLabel>
                  <FieldContent>
                    <div className="grid gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-muted-foreground">0</span>
                        <Badge variant="secondary" className="rounded-full px-3 py-1">
                          {imageAreaHeight} / {targetHeight}
                        </Badge>
                      </div>
                      <Slider
                        value={[imageAreaHeight]}
                        min={0}
                        max={targetHeight}
                        step={1}
                        disabled={lockImageAspectRatio}
                        onValueChange={(value) =>
                          updateImageAreaDimension(
                            "height",
                            typeof value === "number" ? value : (value[0] ?? 0)
                          )
                        }
                      />
                    </div>
                    <FieldDescription>
                      {lockImageAspectRatio ? t("imageAreaHeightLockedHint") : t("imageAreaHeightHint")}
                    </FieldDescription>
                  </FieldContent>
                </Field>

                <Field orientation="horizontal">
                  <FieldLabel htmlFor="lock-image-ratio">{t("lockImageRatio")}</FieldLabel>
                  <Switch
                    id="lock-image-ratio"
                    checked={lockImageAspectRatio}
                    onCheckedChange={handleImageAspectRatioToggle}
                  />
                </Field>

                <Field orientation="responsive">
                  <FieldLabel>{t("fitLabel")}</FieldLabel>
                  <FieldContent>
                    <Select value={fitMode} onValueChange={(value) => setFitMode(value as FitMode)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("fitPlaceholder")}>
                          {t(`fit${FIT_MODES.find((item) => item.value === fitMode)?.key ?? "Contain"}`)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {FIT_MODES.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {t(`fit${item.key}`)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      {t("fitHint")}
                    </FieldDescription>
                  </FieldContent>
                </Field>

                <Field orientation="responsive">
                  <FieldLabel>{t("samplingModeLabel")}</FieldLabel>
                  <FieldContent>
                    <Select
                      value={samplingMode}
                      onValueChange={(value) => setSamplingMode(value as SamplingMode)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("samplingModePlaceholder")}>
                          {t(
                            `sampling${SAMPLING_MODES.find((item) => item.value === samplingMode)?.key ?? "Precise"}`
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {SAMPLING_MODES.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {t(`sampling${item.key}`)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldDescription>{t("samplingModeHint")}</FieldDescription>
                  </FieldContent>
                </Field>

                <Field orientation="horizontal">
                  <FieldLabel htmlFor="lock-ratio">{t("lockRatio")}</FieldLabel>
                  <Switch
                    id="lock-ratio"
                    disabled={preferSquare}
                    checked={lockAspectRatio}
                    onCheckedChange={handleAspectRatioToggle}
                  />
                </Field>

                <Field orientation="horizontal">
                  <FieldLabel htmlFor="show-codes">{t("showCodes")}</FieldLabel>
                  <Switch
                    id="show-codes"
                    checked={showCodes}
                    onCheckedChange={setShowCodes}
                  />
                </Field>

              </FieldGroup>

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[1.5rem] bg-secondary/80 p-4">
                  <p className="text-sm text-muted-foreground">{t("totalBeads")}</p>
                  <p className="mt-1 text-3xl font-semibold">
                    {deferredPattern ? deferredPattern.width * deferredPattern.height : "--"}
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-secondary/80 p-4">
                  <p className="text-sm text-muted-foreground">{t("colorCount")}</p>
                  <p className="mt-1 text-3xl font-semibold">
                    {deferredPattern?.counts.length ?? "--"}
                  </p>
                </div>
              </div>

              {(paletteError || processingError) && (
                <div className="rounded-[1.5rem] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {paletteError || processingError}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="min-w-0 flex flex-col gap-6">
            <Card className="min-w-0 rounded-[2rem] border-white/60 bg-white/70 shadow-[0_24px_64px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
              <CardHeader className="gap-3 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <LayoutGrid className="text-primary" />
                    {t("workspaceTitle")}
                  </CardTitle>
                  <CardDescription>{t("workspaceDesc")}</CardDescription>
                </div>
                <div className="grid w-full grid-cols-1 gap-3 sm:flex sm:w-auto sm:flex-wrap">
                  <Button
                    className="rounded-2xl"
                    disabled={!isPatternReadyForExport}
                    onClick={() => {
                      const studioId = studioIdRef.current;

                      if (!studioId) {
                        return;
                      }

                      window.open(
                        `${window.location.pathname}/export?source=${encodeURIComponent(studioId)}`,
                        "_blank",
                        "noopener,noreferrer"
                      );
                    }}
                  >
                    <ArrowDownToLine data-icon="inline-start" />
                    {t("openLargeExport")}
                  </Button>
                  <Button
                    variant="secondary"
                    className="rounded-2xl sm:w-auto"
                    disabled={!deferredPattern}
                    onClick={() =>
                      downloadPatternImage({
                        fileName: buildExportFileName("preview"),
                        cellSize,
                        showCodes: false,
                        showGrid: false,
                      })
                    }
                  >
                    <ArrowDownToLine data-icon="inline-start" />
                    {t("exportPreview")}
                  </Button>
                  <Button
                    variant="secondary"
                    className="rounded-2xl sm:w-auto"
                    disabled={!deferredPattern}
                    onClick={() =>
                      downloadPatternImage({
                        fileName: buildExportFileName("chart"),
                        cellSize: planCellSize,
                        showCodes,
                        showGrid: true,
                      })
                    }
                  >
                    <ArrowDownToLine data-icon="inline-start" />
                    {t("exportPlan")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={handleWorkspaceTabChange} className="flex flex-col gap-4">
                  <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden tabs-strip-scroll sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0">
                    <TabsList data-zoom-keep="true" className="flex !h-auto w-max min-w-full flex-nowrap items-stretch gap-1 rounded-2xl border border-border/70 bg-secondary/90 p-[3px] shadow-inner dark:bg-white/10 sm:grid sm:w-full sm:grid-cols-4 sm:overflow-visible">
                      <TabsTrigger value="preview" className="!h-auto min-h-[2.5rem] min-w-[5.5rem] flex-none self-auto rounded-xl px-2 py-1.5 text-xs leading-snug whitespace-normal break-words data-active:bg-background sm:min-h-[2.375rem] sm:min-w-0 sm:w-full sm:flex-1 sm:text-sm">
                        {t("tabPreview")}
                      </TabsTrigger>
                      <TabsTrigger value="plan" className="!h-auto min-h-[2.5rem] min-w-[5.5rem] flex-none self-auto rounded-xl px-2 py-1.5 text-xs leading-snug whitespace-normal break-words data-active:bg-background sm:min-h-[2.375rem] sm:min-w-0 sm:w-full sm:flex-1 sm:text-sm">
                        {t("tabPlan")}
                      </TabsTrigger>
                      <TabsTrigger value="plan-colors" className="!h-auto min-h-[2.5rem] min-w-[6.75rem] flex-none self-auto rounded-xl px-2 py-1.5 text-xs leading-snug whitespace-normal break-words data-active:bg-background sm:min-h-[2.375rem] sm:min-w-0 sm:w-full sm:flex-1 sm:text-sm">
                        {t("tabPlanColors")}
                      </TabsTrigger>
                      <TabsTrigger value="source" className="!h-auto min-h-[2.5rem] min-w-[5.5rem] flex-none self-auto rounded-xl px-2 py-1.5 text-xs leading-snug whitespace-normal break-words data-active:bg-background sm:min-h-[2.375rem] sm:min-w-0 sm:w-full sm:flex-1 sm:text-sm">
                        {t("tabSource")}
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="preview" className="mt-0 min-h-0">
                    <CanvasPanel
                      panelId="preview"
                      canvasRef={previewCanvasRef}
                      hasContent={Boolean(deferredPattern)}
                      emptyMessage={t("previewEmpty")}
                      pending={isPending}
                      isDragActive={isDragActive}
                      isZoomActive={zoomActivePanel === "preview"}
                      dragTitle={t("dropImageTitle")}
                      dragDescription={t("dropImageDescription")}
                      zoomTitle={t("zoomGestureTitle")}
                      zoomDescription={t("zoomGestureDescription")}
                      onActivateZoom={setZoomActivePanel}
                      onDragStateChange={setIsDragActive}
                      onDropImport={handleDropImport}
                      onWheelZoom={handleCanvasWheelZoom}
                    />
                  </TabsContent>

                  <TabsContent value="plan" className="mt-0 min-h-0">
                    <CanvasPanel
                      panelId="plan"
                      canvasRef={planCanvasRef}
                      hasContent={Boolean(deferredPattern)}
                      emptyMessage={t("planEmpty")}
                      pending={isPending}
                      isDragActive={isDragActive}
                      isZoomActive={zoomActivePanel === "plan"}
                      dragTitle={t("dropImageTitle")}
                      dragDescription={t("dropImageDescription")}
                      zoomTitle={t("zoomGestureTitle")}
                      zoomDescription={t("zoomGestureDescription")}
                      onActivateZoom={setZoomActivePanel}
                      onDragStateChange={setIsDragActive}
                      onDropImport={handleDropImport}
                      onWheelZoom={handleCanvasWheelZoom}
                    />
                  </TabsContent>

                  <TabsContent value="plan-colors" className="mt-0 min-h-0">
                    <div className="grid gap-4">
                      <CanvasPanel
                        panelId="plan-colors"
                        canvasRef={planWithColorsCanvasRef}
                        hasContent={Boolean(deferredPattern)}
                        emptyMessage={t("planColorsEmpty")}
                        pending={isPending}
                        isDragActive={isDragActive}
                        isZoomActive={zoomActivePanel === "plan-colors"}
                        dragTitle={t("dropImageTitle")}
                        dragDescription={t("dropImageDescription")}
                        zoomTitle={t("zoomGestureTitle")}
                        zoomDescription={t("zoomGestureDescription")}
                        onActivateZoom={setZoomActivePanel}
                        onDragStateChange={setIsDragActive}
                        onDropImport={handleDropImport}
                        onWheelZoom={handleCanvasWheelZoom}
                      />
                      <div className="grid gap-4 rounded-[1.75rem] border border-border/70 bg-background/80 p-4">
                        <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <span>{t("planColorsLegend")}</span>
                          <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-[11px]">
                            {t("usedColorTotal", {count: deferredPattern?.counts.length ?? 0})}
                          </Badge>
                        </p>
                        {allColors.length ? (
                          <div className="flex flex-wrap items-start gap-2">
                            {allColors.map(({ color, count }) => (
                              <div
                                key={`plan-colors-${color.tag}`}
                                className="grid w-[10.75rem] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-2 text-xs"
                              >
                                <span
                                  className="size-4 rounded-full border border-white/70 shadow-sm"
                                  style={{ backgroundColor: color.hex }}
                                />
                                <span className="min-w-0 truncate font-medium">{color.tag}</span>
                                <span className="min-w-[4rem] text-right tabular-nums text-muted-foreground">
                                  {`${count} ${t("beadUnitShort")}`}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <EmptyPanel copy={t("planColorsEmpty")} />
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="source" className="mt-0 min-h-0">
                    <CanvasPanelShell
                      isDragActive={isDragActive}
                      dragTitle={t("dropImageTitle")}
                      dragDescription={t("dropImageDescription")}
                      scrollable
                      onDragStateChange={setIsDragActive}
                      onDropImport={handleDropImport}
                    >
                      {imageUrl ? (
                        <div className="flex w-full max-w-4xl flex-col items-center gap-4">
                          <div className="flex flex-col items-center gap-1 text-center">
                            <p className="text-lg font-semibold">
                              {imageTitle || t("untitledImage")}
                            </p>
                            <p className="text-sm text-muted-foreground">{sourceSummary}</p>
                          </div>
                          <img
                            src={imageUrl}
                            alt="source preview"
                            className="max-h-[18rem] max-w-full rounded-[1.5rem] object-contain shadow-lg sm:max-h-[22rem] lg:max-h-[26rem]"
                          />
                        </div>
                      ) : (
                        <EmptyPanel copy={t("sourceEmpty")} />
                      )}
                    </CanvasPanelShell>
                  </TabsContent>
                </Tabs>

                {activeTab !== "source" ? (
                  <div className="mt-4 rounded-[1.75rem] border border-border/70 bg-background/80 p-4">
                    <Field>
                      <FieldLabel>{t("zoomLabel")}</FieldLabel>
                      <FieldContent>
                        <Slider
                          value={[cellSize]}
                          min={MIN_CELL_SIZE}
                          max={MAX_CELL_SIZE}
                          step={1}
                          onValueChange={(value) =>
                            setCellSize(typeof value === "number" ? value : (value[0] ?? 24))
                          }
                        />
                        <FieldDescription>
                          {t("zoomHint", {size: cellSize})} {t("zoomGestureHint")}
                        </FieldDescription>
                      </FieldContent>
                    </Field>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <Card className="min-w-0 rounded-[2rem] border-white/60 bg-white/70 shadow-[0_24px_64px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <SwatchBook className="text-primary" />
                    <span>{t("colorStatsTitle")}</span>
                    <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-[11px]">
                      {t("usedColorTotal", {count: deferredPattern?.counts.length ?? 0})}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{t("colorStatsDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {allColors.length ? (
                    allColors.map(({ color, count }) => (
                      <div
                        key={color.tag}
                        className="flex items-center justify-between rounded-[1.35rem] border border-border/70 bg-background/80 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="size-10 rounded-2xl border border-white/70 shadow-sm"
                            style={{ backgroundColor: color.hex }}
                          />
                          <div className="space-y-1">
                            <p className="font-medium">{color.tag}</p>
                            <p className="text-sm text-muted-foreground">{color.hex}</p>
                          </div>
                        </div>
                        <Badge variant="secondary">{t("colorCountUnit", {count})}</Badge>
                      </div>
                    ))
                  ) : (
                    <EmptyPanel copy={t("colorStatsEmpty")} />
                  )}
                </CardContent>
              </Card>

              <Card className="min-w-0 rounded-[2rem] border-white/60 bg-white/70 shadow-[0_24px_64px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Droplets className="text-primary" />
                    {t("guideTitle")}
                  </CardTitle>
                  <CardDescription>{t("guideDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="rounded-[1.5rem] bg-secondary/80 p-4">
                    <p className="text-sm text-muted-foreground">{t("outputSize")}</p>
                    <p className="mt-2 text-2xl font-semibold">
                      {targetWidth} x {targetHeight}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] bg-secondary/80 p-4">
                    <p className="text-sm text-muted-foreground">{t("imageAreaTitle")}</p>
                    <p className="mt-2 text-2xl font-semibold">
                      {imageAreaWidth} x {imageAreaHeight}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] bg-secondary/80 p-4">
                    <p className="text-sm text-muted-foreground">{t("fitModeTitle")}</p>
                    <p className="mt-2 text-base font-medium">
                      {t(`fit${FIT_MODES.find((item) => item.value === fitMode)?.key ?? "Contain"}`)}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] bg-secondary/80 p-4">
                    <p className="text-sm text-muted-foreground">{t("samplingModeTitle")}</p>
                    <p className="mt-2 text-base font-medium">
                      {t(
                        `sampling${SAMPLING_MODES.find((item) => item.value === samplingMode)?.key ?? "Precise"}`
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function CanvasPanel({
  panelId,
  canvasRef,
  hasContent,
  emptyMessage,
  pending,
  isDragActive,
  isZoomActive,
  dragTitle,
  dragDescription,
  zoomTitle,
  zoomDescription,
  onActivateZoom,
  onDragStateChange,
  onDropImport,
  onWheelZoom,
}: {
  panelId: "preview" | "plan" | "plan-colors";
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  hasContent: boolean;
  emptyMessage: string;
  pending: boolean;
  isDragActive: boolean;
  isZoomActive: boolean;
  dragTitle: string;
  dragDescription: string;
  zoomTitle: string;
  zoomDescription: string;
  onActivateZoom: (panel: "preview" | "plan" | "plan-colors" | null) => void;
  onDragStateChange: (active: boolean) => void;
  onDropImport: (event: React.DragEvent<HTMLDivElement>) => void;
  onWheelZoom: (event: React.WheelEvent<HTMLDivElement>) => void;
}) {
  return (
    <div className="relative w-full min-w-0">
      <CanvasPanelShell
        panelId={panelId}
        isDragActive={isDragActive}
        isZoomActive={isZoomActive}
        dragTitle={dragTitle}
        dragDescription={dragDescription}
        zoomTitle={zoomTitle}
        zoomDescription={zoomDescription}
        onActivateZoom={onActivateZoom}
        onDragStateChange={onDragStateChange}
        onDropImport={onDropImport}
        onWheelZoom={onWheelZoom}
      >
        <div className="mx-auto flex min-h-[14rem] min-w-full w-max items-center justify-center px-1.5 py-5 sm:min-h-[16rem] lg:min-h-[18rem]">
          {hasContent ? (
            <div className="rounded-[1.45rem] bg-background/70 p-1.5 shadow-[0_8px_22px_rgba(15,23,42,0.08)]">
              <canvas
                ref={canvasRef}
                className={`${pending ? "opacity-60" : "opacity-100"} block rounded-[1.2rem] transition-opacity`}
              />
            </div>
          ) : (
            <EmptyPanel copy={emptyMessage} />
          )}
        </div>
      </CanvasPanelShell>
    </div>
  );
}

function CanvasPanelShell({
  children,
  panelId,
  isDragActive,
  isZoomActive,
  dragTitle,
  dragDescription,
  zoomTitle,
  zoomDescription,
  scrollable = false,
  onActivateZoom,
  onDragStateChange,
  onDropImport,
  onWheelZoom,
}: {
  children: React.ReactNode;
  panelId?: "preview" | "plan" | "plan-colors";
  isDragActive: boolean;
  isZoomActive?: boolean;
  dragTitle: string;
  dragDescription: string;
  zoomTitle?: string;
  zoomDescription?: string;
  scrollable?: boolean;
  onActivateZoom?: (panel: "preview" | "plan" | "plan-colors" | null) => void;
  onDragStateChange: (active: boolean) => void;
  onDropImport: (event: React.DragEvent<HTMLDivElement>) => void;
  onWheelZoom?: (event: React.WheelEvent<HTMLDivElement>) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointerStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    scrollLeft: number;
    scrollTop: number;
    isDragging: boolean;
  } | null>(null);

  function stopPanning() {
    const container = containerRef.current;
    const pointerState = pointerStateRef.current;

    if (container && pointerState) {
      try {
        container.releasePointerCapture(pointerState.pointerId);
      } catch {
        // Ignore browsers that do not support releasePointerCapture for this pointer.
      }
    }

    pointerStateRef.current = null;
  }

  return (
    <div className="relative w-full min-w-0 max-h-[22rem] sm:max-h-[26rem] lg:max-h-[30rem]">
      <div className="relative w-full min-w-0 overflow-clip rounded-[1.75rem]">
        {isZoomActive && !isDragActive && zoomTitle && zoomDescription ? (
          <div className="pointer-events-none absolute left-1/2 top-3 z-20 hidden -translate-x-1/2 md:block">
            <div className="grid min-w-[22rem] max-w-[min(calc(100%-1rem),30rem)] grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-2 rounded-[1.5rem] border border-primary/18 bg-background/90 px-3.5 py-2 text-[11px] text-muted-foreground shadow-[0_8px_24px_rgba(15,23,42,0.12)] backdrop-blur-xl">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ScanSearch className="size-3.5" />
              </span>
              <span className="shrink-0 font-medium text-foreground">{zoomTitle}</span>
              <span className="min-w-0 leading-4 break-words [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
                {zoomDescription}
              </span>
            </div>
          </div>
        ) : null}

        <div
          className={`relative w-full min-w-0 rounded-[1.75rem] bg-background/80 transition-colors ${
            isDragActive
              ? "bg-primary/5"
              : isZoomActive
                ? "cursor-grab bg-primary/[0.045] shadow-[inset_0_0_0_1px_rgba(251,146,60,0.22)]"
                : ""
          }`}
        >
          <div
            className={`pointer-events-none absolute inset-0 z-20 rounded-[1.75rem] border ${
              isDragActive
                ? "border-primary/70"
                : isZoomActive
                  ? "border-primary/55"
                  : "border-border/70"
            }`}
          />

          <div
            ref={containerRef}
            data-zoom-panel={panelId ? "true" : undefined}
            data-zoom-panel-id={panelId}
            className={`relative z-0 max-h-[22rem] p-4 sm:max-h-[26rem] lg:max-h-[30rem] ${
              panelId || scrollable ? "pattern-scroll-panel overflow-auto" : "overflow-hidden"
            }`}
            style={{
              touchAction: isZoomActive ? "none" : "auto",
              userSelect: isZoomActive ? "none" : "auto",
            }}
            onClick={() => {
              if (panelId && onActivateZoom) {
                onActivateZoom(panelId);
              }
            }}
            onPointerDown={(event) => {
              if (panelId && onActivateZoom) {
                onActivateZoom(panelId);
              }

              if (!panelId) {
                return;
              }

              if (event.pointerType === "mouse" && event.button !== 0) {
                return;
              }

              const container = containerRef.current;

              if (!container) {
                return;
              }

              pointerStateRef.current = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                scrollLeft: container.scrollLeft,
                scrollTop: container.scrollTop,
                isDragging: false,
              };

              container.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              const pointerState = pointerStateRef.current;
              const container = containerRef.current;

              if (!pointerState || !container || pointerState.pointerId !== event.pointerId) {
                return;
              }

              const deltaX = event.clientX - pointerState.startX;
              const deltaY = event.clientY - pointerState.startY;

              if (!pointerState.isDragging && Math.hypot(deltaX, deltaY) >= 4) {
                pointerState.isDragging = true;
              }

              if (!pointerState.isDragging) {
                return;
              }

              event.preventDefault();
              container.scrollLeft = pointerState.scrollLeft - deltaX;
              container.scrollTop = pointerState.scrollTop - deltaY;
            }}
            onPointerUp={stopPanning}
            onPointerCancel={stopPanning}
            onDragEnter={(event) => {
              event.preventDefault();
              onDragStateChange(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
              onDragStateChange(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();

              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                onDragStateChange(false);
              }
            }}
            onDrop={onDropImport}
            onWheel={onWheelZoom}
          >
            {isDragActive ? (
              <div className="pointer-events-none absolute inset-4 z-10 flex items-center justify-center rounded-[1.35rem] border border-dashed border-primary/60 bg-background/88 backdrop-blur-sm">
                <div className="flex max-w-sm flex-col items-center gap-3 text-center">
                  <div className="flex size-14 items-center justify-center rounded-[1.5rem] bg-primary/12 text-primary shadow-sm">
                    <Upload className="size-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{dragTitle}</p>
                    <p className="text-sm leading-6 text-muted-foreground">{dragDescription}</p>
                  </div>
                </div>
              </div>
            ) : null}

            <div
              className={`mx-auto flex min-h-[14rem] min-w-full w-max items-center justify-center pt-4 sm:min-h-[16rem] lg:min-h-[18rem] ${
                isZoomActive ? "cursor-grab active:cursor-grabbing" : ""
              }`}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyPanel({ copy }: { copy: string }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-center">
      <div className="flex size-14 items-center justify-center rounded-[1.5rem] bg-secondary text-primary">
        <Palette className="size-6" />
      </div>
      <p className="text-sm leading-7 text-muted-foreground">{copy}</p>
    </div>
  );
}

function sanitizeFileNameSegment(value: string) {
  const sanitized = value
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return sanitized || "export";
}
