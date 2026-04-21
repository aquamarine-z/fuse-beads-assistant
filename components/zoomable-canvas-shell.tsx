"use client";

import { useRef } from "react";
import { ScanSearch, Upload } from "lucide-react";

type ZoomableCanvasShellProps = {
  children: React.ReactNode;
  active: boolean;
  dragActive?: boolean;
  panelId?: string;
  scrollable?: boolean;
  outerClassName?: string;
  clipClassName?: string;
  surfaceClassName?: string;
  scrollClassName?: string;
  borderIdleClassName?: string;
  borderActiveClassName?: string;
  borderDragClassName?: string;
  inactiveSurfaceClassName?: string;
  activeSurfaceClassName?: string;
  dragSurfaceClassName?: string;
  activeHintTitle?: string;
  activeHintDescription?: string;
  dragTitle?: string;
  dragDescription?: string;
  keepActiveDataAttr?: string;
  panelDataAttr?: string;
  onActiveChange?: (active: boolean) => void;
  onDragStateChange?: (active: boolean) => void;
  onDropImport?: (event: React.DragEvent<HTMLDivElement>) => void;
  onWheel?: (event: React.WheelEvent<HTMLDivElement>) => void;
};

export function ZoomableCanvasShell({
  children,
  active,
  dragActive = false,
  panelId,
  scrollable = false,
  outerClassName = "relative w-full min-w-0 max-h-[22rem] sm:max-h-[26rem] lg:max-h-[30rem]",
  clipClassName = "relative w-full min-w-0 overflow-clip rounded-[1.75rem]",
  surfaceClassName,
  scrollClassName,
  borderIdleClassName = "border-border/70",
  borderActiveClassName = "border-primary/55",
  borderDragClassName = "border-primary/70",
  inactiveSurfaceClassName = "bg-background/80",
  activeSurfaceClassName = "cursor-grab bg-primary/[0.045] shadow-[inset_0_0_0_1px_rgba(251,146,60,0.22)]",
  dragSurfaceClassName = "bg-primary/5",
  activeHintTitle,
  activeHintDescription,
  dragTitle,
  dragDescription,
  keepActiveDataAttr,
  panelDataAttr = "data-zoom-panel",
  onActiveChange,
  onDragStateChange,
  onDropImport,
  onWheel,
}: ZoomableCanvasShellProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointerStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    scrollLeft: number;
    scrollTop: number;
    isDragging: boolean;
  } | null>(null);

  const computedSurfaceClassName = surfaceClassName ?? `relative w-full min-w-0 rounded-[1.75rem] transition-colors ${
    dragActive ? dragSurfaceClassName : active ? activeSurfaceClassName : inactiveSurfaceClassName
  }`;

  const computedScrollClassName = scrollClassName ?? `relative z-0 max-h-[22rem] p-4 sm:max-h-[26rem] lg:max-h-[30rem] ${
    panelId || scrollable ? "pattern-scroll-panel overflow-auto" : "overflow-hidden"
  }`;

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
    <div className={outerClassName}>
      <div className={clipClassName}>
        {active && !dragActive && activeHintTitle && activeHintDescription ? (
          <div className="pointer-events-none absolute left-1/2 top-3 z-20 hidden -translate-x-1/2 md:block">
            <div className="grid min-w-[22rem] max-w-[min(calc(100%-1rem),30rem)] grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-2 rounded-[1.5rem] border border-primary/18 bg-background/90 px-3.5 py-2 text-[11px] text-muted-foreground shadow-[0_8px_24px_rgba(15,23,42,0.12)] backdrop-blur-xl">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ScanSearch className="size-3.5" />
              </span>
              <span className="shrink-0 font-medium text-foreground">{activeHintTitle}</span>
              <span className="min-w-0 leading-4 break-words [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
                {activeHintDescription}
              </span>
            </div>
          </div>
        ) : null}

        <div
          data-slot="zoomable-canvas-surface"
          {...(keepActiveDataAttr ? { [keepActiveDataAttr]: "true" } : {})}
          className={computedSurfaceClassName}
        >
          <div
            className={`pointer-events-none absolute inset-0 z-20 rounded-[inherit] border ${
              dragActive
                ? borderDragClassName
                : active
                  ? borderActiveClassName
                  : borderIdleClassName
            }`}
          />

          <div
            ref={containerRef}
            {...(panelId ? { [panelDataAttr]: "true", "data-zoom-panel-id": panelId } : {})}
            className={computedScrollClassName}
            style={{
              touchAction: active ? "none" : "auto",
              userSelect: active ? "none" : "auto",
            }}
            onClick={() => onActiveChange?.(true)}
            onDragEnter={(event) => {
              event.preventDefault();
              onDragStateChange?.(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
              onDragStateChange?.(true);
            }}
            onDragLeave={(event) => {
              if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
                return;
              }

              onDragStateChange?.(false);
            }}
            onDrop={(event) => {
              onDropImport?.(event);
            }}
            onPointerDown={(event) => {
              onActiveChange?.(true);

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

              if (!pointerState.isDragging || !active) {
                return;
              }

              event.preventDefault();
              container.scrollLeft = pointerState.scrollLeft - deltaX;
              container.scrollTop = pointerState.scrollTop - deltaY;
            }}
            onPointerUp={stopPanning}
            onPointerCancel={stopPanning}
            onWheel={onWheel}
          >
            {dragActive && dragTitle && dragDescription ? (
              <div className="pointer-events-none absolute inset-4 z-10 flex items-center justify-center rounded-[1.35rem] border border-dashed border-primary/60 bg-background/88 backdrop-blur-sm">
                <div className="mx-auto flex max-w-sm flex-col items-center gap-3 px-4 text-center">
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

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
