export type FitMode = "contain" | "cover" | "stretch";
export type SamplingMode = "smooth" | "precise";

type RgbColor = {
  r: number;
  g: number;
  b: number;
};

type LabColor = {
  l: number;
  a: number;
  b: number;
};

export type PaletteColor = {
  hex: string;
  tag: string;
  rgb: RgbColor;
  lab: LabColor;
};

export type PatternCell = PaletteColor & {
  x: number;
  y: number;
};

export type PatternResult = {
  width: number;
  height: number;
  cells: PatternCell[];
  counts: Array<{
    color: PaletteColor;
    count: number;
  }>;
};

const WHITE_RGB: RgbColor = { r: 255, g: 255, b: 255 };
const WHITE_LAB = rgbToLab(WHITE_RGB);

export function parsePaletteCsv(csv: string): PaletteColor[] {
  return csv
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [hex, tag] = line.split(",");
      const rgb = hexToRgb(hex);

      return {
        hex,
        tag,
        rgb,
        lab: rgbToLab(rgb),
      };
    });
}

export function renderPatternToCanvas(
  canvas: HTMLCanvasElement,
  pattern: PatternResult,
  options: {
    cellSize: number;
    showCodes: boolean;
    showGrid: boolean;
  }
) {
  const { cellSize, showCodes, showGrid } = options;
  const width = pattern.width * cellSize;
  const height = pattern.height * cellSize;
  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  context.clearRect(0, 0, width, height);
  context.imageSmoothingEnabled = false;

  for (const cell of pattern.cells) {
    const x = cell.x * cellSize;
    const y = cell.y * cellSize;

    context.fillStyle = cell.hex;
    context.fillRect(x, y, cellSize, cellSize);

    if (showGrid) {
      context.strokeStyle = "rgba(15, 23, 42, 0.16)";
      context.lineWidth = Math.max(1, cellSize * 0.04);
      context.strokeRect(x, y, cellSize, cellSize);
    }

    if (showCodes && cellSize >= 16) {
      context.fillStyle = pickReadableText(cell.rgb);
      const codeFontSize =
        cellSize <= 18
          ? Math.max(7, cellSize * 0.24)
          : cellSize <= 24
            ? Math.max(8, cellSize * 0.27)
            : Math.max(10, cellSize * 0.3);
      context.font = `${codeFontSize}px ui-sans-serif, system-ui, sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(cell.tag, x + cellSize / 2, y + cellSize / 2);
    }
  }
}

export function renderPatternWithLegendToCanvas(
  canvas: HTMLCanvasElement,
  pattern: PatternResult,
  options: {
    cellSize: number;
    legendTitle: string;
    beadUnit: string;
  }
) {
  const { cellSize, legendTitle, beadUnit } = options;
  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  const chartWidth = pattern.width * cellSize;
  const chartHeight = pattern.height * cellSize;
  const padding = Math.max(24, cellSize);
  const legendGap = 14;
  const itemHeight = 24;
  const minItemWidth = 132;
  const maxColumns = 8;
  const availableLegendWidth = Math.max(chartWidth, minItemWidth);
  const columns = Math.min(
    maxColumns,
    Math.max(1, Math.min(pattern.counts.length, Math.floor((availableLegendWidth + legendGap) / (minItemWidth + legendGap))))
  );
  const rows = Math.max(1, Math.ceil(pattern.counts.length / columns));
  const titleHeight = 56;
  const legendWidth = availableLegendWidth;
  const itemWidth = Math.floor((legendWidth - legendGap * (columns - 1)) / columns);
  const legendHeight = titleHeight + rows * itemHeight + Math.max(0, rows - 1) * legendGap;
  const contentWidth = Math.max(chartWidth, legendWidth);
  const width = contentWidth + padding * 2;
  const height = chartHeight + legendHeight + padding * 3;
  const chartX = padding + Math.max(0, (contentWidth - chartWidth) / 2);
  const legendX = padding;

  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  context.clearRect(0, 0, width, height);
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, width, height);

  const chartCanvas = document.createElement("canvas");
  renderPatternToCanvas(chartCanvas, pattern, {
    cellSize,
    showCodes: true,
    showGrid: true,
  });

  context.drawImage(chartCanvas, chartX, padding);
  drawLegendSection(context, pattern, {
    legendY: padding * 2 + chartHeight,
    legendTitle,
    beadUnit,
    padding,
    titleHeight,
    itemWidth,
    itemHeight,
    legendGap,
    columns,
  });
}

export function renderPatternExportToCanvas(
  canvas: HTMLCanvasElement,
  pattern: PatternResult,
  options: {
    cellSize: number;
    showCodes: boolean;
    legendTitle: string;
    beadUnit: string;
    title: string;
    boardSizeLabel: string;
    imageAreaSizeLabel: string;
    boardWidth: number;
    boardHeight: number;
    imageAreaWidth: number;
    imageAreaHeight: number;
  }
) {
  const {
    cellSize,
    showCodes,
    legendTitle,
    beadUnit,
    title,
    boardSizeLabel,
    imageAreaSizeLabel,
    boardWidth,
    boardHeight,
    imageAreaWidth,
    imageAreaHeight,
  } = options;
  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  const chartWidth = pattern.width * cellSize;
  const chartHeight = pattern.height * cellSize;
  const padding = 24;
  const hasTitle = Boolean(title.trim());
  const headerHeight = hasTitle ? 82 : 48;
  const axisBand = Math.max(24, Math.min(38, Math.round(cellSize * 0.9)));
  const legendGap = 14;
  const itemHeight = 24;
  const minItemWidth = 132;
  const maxColumns = 8;
  const chartWithAxesWidth = chartWidth + axisBand * 2;
  const chartWithAxesHeight = chartHeight + axisBand * 2;
  const availableLegendWidth = Math.max(chartWithAxesWidth, minItemWidth);
  const columns = Math.min(
    maxColumns,
    Math.max(
      1,
      Math.min(pattern.counts.length, Math.floor((availableLegendWidth + legendGap) / (minItemWidth + legendGap)))
    )
  );
  const rows = Math.max(1, Math.ceil(pattern.counts.length / columns));
  const titleHeight = 56;
  const legendWidth = availableLegendWidth;
  const itemWidth = Math.floor((legendWidth - legendGap * (columns - 1)) / columns);
  const legendHeight = titleHeight + rows * itemHeight + Math.max(0, rows - 1) * legendGap;
  const contentWidth = Math.max(chartWithAxesWidth, legendWidth);
  const width = contentWidth + padding * 2;
  const height = headerHeight + chartWithAxesHeight + legendHeight + padding * 4;
  const chartAreaX = padding + Math.max(0, (contentWidth - chartWithAxesWidth) / 2);
  const chartX = chartAreaX + axisBand;
  const chartY = padding + headerHeight + axisBand;

  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  context.clearRect(0, 0, width, height);
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, width, height);

  context.fillStyle = "rgba(15, 23, 42, 0.96)";
  context.textAlign = "left";
  context.textBaseline = "top";
  if (hasTitle) {
    context.font = "700 28px ui-sans-serif, system-ui, sans-serif";
    context.fillText(title, padding, padding);
  }
  context.font = "500 15px ui-sans-serif, system-ui, sans-serif";
  context.fillStyle = "rgba(71, 85, 105, 0.96)";
  context.fillText(
    `${boardSizeLabel}: ${boardWidth} x ${boardHeight}    ${imageAreaSizeLabel}: ${imageAreaWidth} x ${imageAreaHeight}`,
    padding,
    padding + (hasTitle ? 40 : 8)
  );

  const chartCanvas = document.createElement("canvas");
  renderPatternToCanvas(chartCanvas, pattern, {
    cellSize,
    showCodes,
    showGrid: true,
  });

  drawAxisLabels(context, pattern, {
    chartAreaX,
    chartY,
    chartWidth,
    chartHeight,
    axisBand,
  });

  context.drawImage(chartCanvas, chartX, chartY, chartWidth, chartHeight);

  drawLegendSection(context, pattern, {
    legendY: padding + headerHeight + chartWithAxesHeight + padding,
    legendTitle,
    beadUnit,
    padding,
    titleHeight,
    itemWidth,
    itemHeight,
    legendGap,
    columns,
  });
}

function drawAxisLabels(
  context: CanvasRenderingContext2D,
  pattern: PatternResult,
  options: {
    chartAreaX: number;
    chartY: number;
    chartWidth: number;
    chartHeight: number;
    axisBand: number;
  }
) {
  const { chartAreaX, chartY, chartWidth, chartHeight, axisBand } = options;
  const cellWidth = chartWidth / Math.max(pattern.width, 1);
  const cellHeight = chartHeight / Math.max(pattern.height, 1);
  const topY = chartY - axisBand / 2;
  const bottomY = chartY + chartHeight + axisBand / 2;
  const leftX = chartAreaX + axisBand / 2;
  const rightX = chartAreaX + axisBand + chartWidth + axisBand / 2;
  const horizontalFont = `${Math.max(10, Math.min(15, Math.floor(cellWidth * 0.42)))}px ui-sans-serif, system-ui, sans-serif`;
  const verticalFont = `${Math.max(10, Math.min(15, Math.floor(cellHeight * 0.42)))}px ui-sans-serif, system-ui, sans-serif`;

  context.fillStyle = "rgba(15, 23, 42, 0.82)";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = horizontalFont;

  for (let x = 0; x < pattern.width; x += 1) {
    const labelX = chartAreaX + axisBand + x * cellWidth + cellWidth / 2;
    const label = String(x + 1);
    context.fillText(label, labelX, topY);
    context.fillText(label, labelX, bottomY);
  }

  context.font = verticalFont;

  for (let y = 0; y < pattern.height; y += 1) {
    const labelY = chartY + y * cellHeight + cellHeight / 2;
    const label = String(y + 1);
    context.fillText(label, leftX, labelY);
    context.fillText(label, rightX, labelY);
  }
}

function drawLegendSection(
  context: CanvasRenderingContext2D,
  pattern: PatternResult,
  options: {
    legendY: number;
    legendTitle: string;
    beadUnit: string;
    padding: number;
    titleHeight: number;
    itemWidth: number;
    itemHeight: number;
    legendGap: number;
    columns: number;
  }
) {
  const {
    legendY,
    legendTitle,
    beadUnit,
    padding,
    titleHeight,
    itemWidth,
    itemHeight,
    legendGap,
    columns,
  } = options;
  const legendX = padding;

  context.fillStyle = "rgba(15, 23, 42, 0.92)";
  context.font = "600 22px ui-sans-serif, system-ui, sans-serif";
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.fillText(legendTitle, legendX, legendY + titleHeight / 2);

  pattern.counts.forEach(({ color, count }, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = legendX + column * (itemWidth + legendGap);
    const y = legendY + titleHeight + row * (itemHeight + legendGap);

    context.shadowColor = "rgba(15, 23, 42, 0.18)";
    context.shadowBlur = 6;
    context.shadowOffsetY = 1;
    context.fillStyle = color.hex;
    roundRect(context, x, y + 6, 10, 10, 999);
    context.fill();
    context.shadowColor = "transparent";
    context.shadowBlur = 0;
    context.shadowOffsetY = 0;

    context.strokeStyle = "rgba(15, 23, 42, 0.14)";
    context.lineWidth = 1;
    context.stroke();

    context.fillStyle = "rgba(15, 23, 42, 0.92)";
    context.font = "600 11px ui-sans-serif, system-ui, sans-serif";
    context.textBaseline = "middle";
    context.fillText(color.tag, x + 16, y + 11);

    context.textAlign = "right";
    context.fillStyle = "rgba(15, 23, 42, 0.92)";
    context.font = "600 11px ui-sans-serif, system-ui, sans-serif";
    context.fillText(`${count} ${beadUnit}`, x + itemWidth, y + 11);
    context.textAlign = "left";
  });
}

export function generatePatternFromImage(
  image: HTMLImageElement,
  palette: PaletteColor[],
  boardWidth: number,
  boardHeight: number,
  imageWidth: number,
  imageHeight: number,
  fitMode: FitMode,
  samplingMode: SamplingMode = "precise",
  colorMergeTolerance = 0,
  backgroundTag = "H2"
): PatternResult {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("Canvas is unavailable in this browser.");
  }

  canvas.width = boardWidth;
  canvas.height = boardHeight;
  context.imageSmoothingEnabled = true;
  context.fillStyle = findPaletteBackground(palette, backgroundTag).hex;
  context.fillRect(0, 0, boardWidth, boardHeight);

  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const scaleX = imageWidth / sourceWidth;
  const scaleY = imageHeight / sourceHeight;
  const imageAreaX = Math.round((boardWidth - imageWidth) / 2);
  const imageAreaY = Math.round((boardHeight - imageHeight) / 2);

  let drawWidth = imageWidth;
  let drawHeight = imageHeight;

  if (imageWidth <= 0 || imageHeight <= 0) {
    drawWidth = 0;
    drawHeight = 0;
  } else if (fitMode === "contain") {
    const scale = Math.min(scaleX, scaleY);
    drawWidth = sourceWidth * scale;
    drawHeight = sourceHeight * scale;
  } else if (fitMode === "cover") {
    const scale = Math.max(scaleX, scaleY);
    drawWidth = sourceWidth * scale;
    drawHeight = sourceHeight * scale;
  }

  const roundedDrawWidth = Math.round(drawWidth);
  const roundedDrawHeight = Math.round(drawHeight);
  const drawX = Math.round(imageAreaX + (imageWidth - roundedDrawWidth) / 2);
  const drawY = Math.round(imageAreaY + (imageHeight - roundedDrawHeight) / 2);
  const backgroundColor = findPaletteBackground(palette, backgroundTag);

  if (samplingMode === "precise") {
    const precisePattern = generatePatternWithPreciseSampling(image, palette, {
      boardWidth,
      boardHeight,
      imageWidth,
      imageHeight,
      imageAreaX,
      imageAreaY,
      drawX,
      drawY,
      drawWidth: roundedDrawWidth,
      drawHeight: roundedDrawHeight,
      backgroundColor,
    });

    return colorMergeTolerance > 0
      ? mergePatternColors(precisePattern, colorMergeTolerance, backgroundTag)
      : precisePattern;
  }

  if (roundedDrawWidth > 0 && roundedDrawHeight > 0) {
    context.imageSmoothingQuality = "high";
    context.drawImage(image, drawX, drawY, roundedDrawWidth, roundedDrawHeight);
  }

  const pixels = context.getImageData(0, 0, boardWidth, boardHeight).data;
  const cells: PatternCell[] = [];
  const counts = new Map<string, { color: PaletteColor; count: number }>();
  const nearestCache = new Map<number, PaletteColor>();

  for (let y = 0; y < boardHeight; y += 1) {
    for (let x = 0; x < boardWidth; x += 1) {
      const pixelIndex = (y * boardWidth + x) * 4;
      const alpha = pixels[pixelIndex + 3];
      const rgb =
        alpha < 16
          ? WHITE_RGB
          : {
              r: pixels[pixelIndex],
              g: pixels[pixelIndex + 1],
              b: pixels[pixelIndex + 2],
            };

      const packed = (rgb.r << 16) | (rgb.g << 8) | rgb.b;
      const nearest =
        nearestCache.get(packed) ??
        findNearestPaletteColor(rgb, palette, nearestCache, packed);

      const cell: PatternCell = {
        ...nearest,
        x,
        y,
      };

      cells.push(cell);

      const existing = counts.get(nearest.tag);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(nearest.tag, { color: nearest, count: 1 });
      }
    }
  }

  const initialPattern = buildPatternResult(boardWidth, boardHeight, cells);

  return colorMergeTolerance > 0
    ? mergePatternColors(initialPattern, colorMergeTolerance, backgroundTag)
    : initialPattern;
}

function generatePatternWithPreciseSampling(
  image: HTMLImageElement,
  palette: PaletteColor[],
  options: {
    boardWidth: number;
    boardHeight: number;
    imageWidth: number;
    imageHeight: number;
    imageAreaX: number;
    imageAreaY: number;
    drawX: number;
    drawY: number;
    drawWidth: number;
    drawHeight: number;
    backgroundColor: PaletteColor;
  }
) {
  const {
    boardWidth,
    boardHeight,
    imageWidth,
    imageHeight,
    imageAreaX,
    imageAreaY,
    drawX,
    drawY,
    drawWidth,
    drawHeight,
    backgroundColor,
  } = options;
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = sourceWidth;
  sourceCanvas.height = sourceHeight;
  const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });

  if (!sourceContext) {
    throw new Error("Canvas is unavailable in this browser.");
  }

  sourceContext.drawImage(image, 0, 0, sourceWidth, sourceHeight);
  const sourcePixels = sourceContext.getImageData(0, 0, sourceWidth, sourceHeight).data;
  const nearestCache = new Map<number, PaletteColor>();
  const cells: PatternCell[] = [];

  for (let y = 0; y < boardHeight; y += 1) {
    for (let x = 0; x < boardWidth; x += 1) {
      const sampleRgb = sampleBoardCellColor(
        sourcePixels,
        sourceWidth,
        sourceHeight,
        x,
        y,
        {
          imageAreaX,
          imageAreaY,
          imageWidth,
          imageHeight,
          drawX,
          drawY,
          drawWidth,
          drawHeight,
        },
        backgroundColor.rgb
      );
      const packed = (sampleRgb.r << 16) | (sampleRgb.g << 8) | sampleRgb.b;
      const nearest =
        nearestCache.get(packed) ??
        findNearestPaletteColor(sampleRgb, palette, nearestCache, packed);

      cells.push({
        ...nearest,
        x,
        y,
      });
    }
  }

  return buildPatternResult(boardWidth, boardHeight, cells);
}

function sampleBoardCellColor(
  sourcePixels: Uint8ClampedArray,
  sourceWidth: number,
  sourceHeight: number,
  cellX: number,
  cellY: number,
  drawArea: {
    imageAreaX: number;
    imageAreaY: number;
    imageWidth: number;
    imageHeight: number;
    drawX: number;
    drawY: number;
    drawWidth: number;
    drawHeight: number;
  },
  backgroundRgb: RgbColor
) {
  const {
    imageAreaX,
    imageAreaY,
    imageWidth,
    imageHeight,
    drawX,
    drawY,
    drawWidth,
    drawHeight,
  } = drawArea;

  if (
    imageWidth <= 0 ||
    imageHeight <= 0 ||
    cellX < imageAreaX ||
    cellX >= imageAreaX + imageWidth ||
    cellY < imageAreaY ||
    cellY >= imageAreaY + imageHeight ||
    drawWidth <= 0 ||
    drawHeight <= 0
  ) {
    return backgroundRgb;
  }

  const sampleOffsets = [0.125, 0.375, 0.625, 0.875];
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let totalSamples = 0;

  for (const offsetY of sampleOffsets) {
    for (const offsetX of sampleOffsets) {
      const boardSampleX = cellX + offsetX;
      const boardSampleY = cellY + offsetY;

      if (
        boardSampleX < imageAreaX ||
        boardSampleX > imageAreaX + imageWidth ||
        boardSampleY < imageAreaY ||
        boardSampleY > imageAreaY + imageHeight
      ) {
        sumR += backgroundRgb.r;
        sumG += backgroundRgb.g;
        sumB += backgroundRgb.b;
        totalSamples += 1;
        continue;
      }

      const normalizedX = (boardSampleX - drawX) / drawWidth;
      const normalizedY = (boardSampleY - drawY) / drawHeight;

      if (
        normalizedX < 0 ||
        normalizedX > 1 ||
        normalizedY < 0 ||
        normalizedY > 1
      ) {
        sumR += backgroundRgb.r;
        sumG += backgroundRgb.g;
        sumB += backgroundRgb.b;
        totalSamples += 1;
        continue;
      }

      const sampled = sampleImageBilinear(
        sourcePixels,
        sourceWidth,
        sourceHeight,
        normalizedX * (sourceWidth - 1),
        normalizedY * (sourceHeight - 1),
        backgroundRgb
      );

      sumR += sampled.r;
      sumG += sampled.g;
      sumB += sampled.b;
      totalSamples += 1;
    }
  }

  return {
    r: Math.round(sumR / totalSamples),
    g: Math.round(sumG / totalSamples),
    b: Math.round(sumB / totalSamples),
  };
}

function sampleImageBilinear(
  sourcePixels: Uint8ClampedArray,
  sourceWidth: number,
  sourceHeight: number,
  x: number,
  y: number,
  backgroundRgb: RgbColor
) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(sourceWidth - 1, x0 + 1);
  const y1 = Math.min(sourceHeight - 1, y0 + 1);
  const tx = x - x0;
  const ty = y - y0;

  const topLeft = readSourcePixel(sourcePixels, sourceWidth, x0, y0, backgroundRgb);
  const topRight = readSourcePixel(sourcePixels, sourceWidth, x1, y0, backgroundRgb);
  const bottomLeft = readSourcePixel(sourcePixels, sourceWidth, x0, y1, backgroundRgb);
  const bottomRight = readSourcePixel(sourcePixels, sourceWidth, x1, y1, backgroundRgb);

  return {
    r: Math.round(
      lerp(lerp(topLeft.r, topRight.r, tx), lerp(bottomLeft.r, bottomRight.r, tx), ty)
    ),
    g: Math.round(
      lerp(lerp(topLeft.g, topRight.g, tx), lerp(bottomLeft.g, bottomRight.g, tx), ty)
    ),
    b: Math.round(
      lerp(lerp(topLeft.b, topRight.b, tx), lerp(bottomLeft.b, bottomRight.b, tx), ty)
    ),
  };
}

function readSourcePixel(
  sourcePixels: Uint8ClampedArray,
  sourceWidth: number,
  x: number,
  y: number,
  backgroundRgb: RgbColor
) {
  const index = (y * sourceWidth + x) * 4;
  const alpha = sourcePixels[index + 3] / 255;

  if (alpha <= 0) {
    return backgroundRgb;
  }

  return {
    r: Math.round(sourcePixels[index] * alpha + backgroundRgb.r * (1 - alpha)),
    g: Math.round(sourcePixels[index + 1] * alpha + backgroundRgb.g * (1 - alpha)),
    b: Math.round(sourcePixels[index + 2] * alpha + backgroundRgb.b * (1 - alpha)),
  };
}

function buildPatternResult(width: number, height: number, cells: PatternCell[]): PatternResult {
  const counts = new Map<string, { color: PaletteColor; count: number }>();

  for (const cell of cells) {
    const existing = counts.get(cell.tag);

    if (existing) {
      existing.count += 1;
    } else {
      counts.set(cell.tag, { color: cell, count: 1 });
    }
  }

  return {
    width,
    height,
    cells,
    counts: Array.from(counts.values()).sort((left, right) => right.count - left.count),
  };
}

function findNearestPaletteColor(
  rgb: RgbColor,
  palette: PaletteColor[],
  cache: Map<number, PaletteColor>,
  packed: number
) {
  const lab = rgb.r === 255 && rgb.g === 255 && rgb.b === 255 ? WHITE_LAB : rgbToLab(rgb);
  let bestColor = palette[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const candidate of palette) {
    const distance = deltaE(lab, candidate.lab);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestColor = candidate;
    }
  }

  cache.set(packed, bestColor);
  return bestColor;
}

function findPaletteBackground(palette: PaletteColor[], tag: string) {
  return palette.find((item) => item.tag === tag) ?? palette[0];
}

function mergePatternColors(
  pattern: PatternResult,
  tolerance: number,
  backgroundTag: string
) {
  const representativeMap = new Map<string, PaletteColor>();
  const sortedColors = [...pattern.counts].sort((left, right) => right.count - left.count);

  for (const entry of sortedColors) {
    if (representativeMap.has(entry.color.tag)) {
      continue;
    }

    representativeMap.set(entry.color.tag, entry.color);

    if (entry.color.tag === backgroundTag) {
      continue;
    }

    for (const candidate of sortedColors) {
      if (
        candidate.color.tag === backgroundTag ||
        representativeMap.has(candidate.color.tag)
      ) {
        continue;
      }

      if (deltaE(entry.color.lab, candidate.color.lab) <= tolerance) {
        representativeMap.set(candidate.color.tag, entry.color);
      }
    }
  }

  const nextCounts = new Map<string, { color: PaletteColor; count: number }>();
  const nextCells = pattern.cells.map((cell) => {
    const mergedColor = representativeMap.get(cell.tag) ?? cell;
    const existing = nextCounts.get(mergedColor.tag);

    if (existing) {
      existing.count += 1;
    } else {
      nextCounts.set(mergedColor.tag, { color: mergedColor, count: 1 });
    }

    return {
      ...mergedColor,
      x: cell.x,
      y: cell.y,
    };
  });

  return {
    width: pattern.width,
    height: pattern.height,
    cells: nextCells,
    counts: Array.from(nextCounts.values()).sort((left, right) => right.count - left.count),
  };
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(x + width, y + height, x, y + height, safeRadius);
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
}

function deltaE(left: LabColor, right: LabColor) {
  const averageLightness = (left.l + right.l) / 2;
  const chromaLeft = Math.sqrt(left.a ** 2 + left.b ** 2);
  const chromaRight = Math.sqrt(right.a ** 2 + right.b ** 2);
  const averageChroma = (chromaLeft + chromaRight) / 2;
  const averageChromaPower7 = averageChroma ** 7;
  const compensation =
    0.5 * (1 - Math.sqrt(averageChromaPower7 / (averageChromaPower7 + 25 ** 7)));

  const adjustedALeft = left.a * (1 + compensation);
  const adjustedARight = right.a * (1 + compensation);
  const adjustedChromaLeft = Math.sqrt(adjustedALeft ** 2 + left.b ** 2);
  const adjustedChromaRight = Math.sqrt(adjustedARight ** 2 + right.b ** 2);
  const averageAdjustedChroma = (adjustedChromaLeft + adjustedChromaRight) / 2;

  const hueLeft = getHueAngle(adjustedALeft, left.b);
  const hueRight = getHueAngle(adjustedARight, right.b);
  const lightnessDelta = right.l - left.l;
  const chromaDelta = adjustedChromaRight - adjustedChromaLeft;

  const hueDeltaRadians = getHueDeltaRadians(
    adjustedChromaLeft,
    adjustedChromaRight,
    hueLeft,
    hueRight
  );
  const hueDelta = 2 * Math.sqrt(adjustedChromaLeft * adjustedChromaRight) * Math.sin(hueDeltaRadians / 2);

  const averageHue = getAverageHue(adjustedChromaLeft, adjustedChromaRight, hueLeft, hueRight);
  const weightingTerm =
    1 -
    0.17 * Math.cos(averageHue - degreesToRadians(30)) +
    0.24 * Math.cos(2 * averageHue) +
    0.32 * Math.cos(3 * averageHue + degreesToRadians(6)) -
    0.2 * Math.cos(4 * averageHue - degreesToRadians(63));

  const lightnessScale =
    1 +
    (0.015 * (averageLightness - 50) ** 2) /
      Math.sqrt(20 + (averageLightness - 50) ** 2);
  const chromaScale = 1 + 0.045 * averageAdjustedChroma;
  const hueScale = 1 + 0.015 * averageAdjustedChroma * weightingTerm;

  const hueRotation =
    30 *
    Math.exp(-(((radiansToDegrees(averageHue) - 275) / 25) ** 2));
  const rotationTerm =
    -2 *
    Math.sqrt(
      averageAdjustedChroma ** 7 / (averageAdjustedChroma ** 7 + 25 ** 7)
    ) *
    Math.sin(degreesToRadians(2 * hueRotation));

  const normalizedLightness = lightnessDelta / lightnessScale;
  const normalizedChroma = chromaDelta / chromaScale;
  const normalizedHue = hueDelta / hueScale;

  return Math.sqrt(
    normalizedLightness ** 2 +
      normalizedChroma ** 2 +
      normalizedHue ** 2 +
      rotationTerm * normalizedChroma * normalizedHue
  );
}

function getHueAngle(a: number, b: number) {
  if (a === 0 && b === 0) {
    return 0;
  }

  const angle = Math.atan2(b, a);
  return angle >= 0 ? angle : angle + Math.PI * 2;
}

function getHueDeltaRadians(
  chromaLeft: number,
  chromaRight: number,
  hueLeft: number,
  hueRight: number
) {
  if (chromaLeft === 0 || chromaRight === 0) {
    return 0;
  }

  let delta = hueRight - hueLeft;

  if (delta > Math.PI) {
    delta -= Math.PI * 2;
  } else if (delta < -Math.PI) {
    delta += Math.PI * 2;
  }

  return delta;
}

function getAverageHue(
  chromaLeft: number,
  chromaRight: number,
  hueLeft: number,
  hueRight: number
) {
  if (chromaLeft === 0 || chromaRight === 0) {
    return hueLeft + hueRight;
  }

  const difference = Math.abs(hueLeft - hueRight);

  if (difference <= Math.PI) {
    return (hueLeft + hueRight) / 2;
  }

  return (hueLeft + hueRight + Math.PI * 2) / 2 - (hueLeft + hueRight >= Math.PI * 2 ? Math.PI : 0);
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}

function radiansToDegrees(value: number) {
  return (value * 180) / Math.PI;
}

function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount;
}

function hexToRgb(hex: string): RgbColor {
  const normalized = hex.replace("#", "");

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToLab(rgb: RgbColor): LabColor {
  const xyz = rgbToXyz(rgb);
  const x = pivotXyz(xyz.x / 95.047);
  const y = pivotXyz(xyz.y / 100);
  const z = pivotXyz(xyz.z / 108.883);

  return {
    l: 116 * y - 16,
    a: 500 * (x - y),
    b: 200 * (y - z),
  };
}

function rgbToXyz(rgb: RgbColor) {
  const r = pivotRgb(rgb.r / 255);
  const g = pivotRgb(rgb.g / 255);
  const b = pivotRgb(rgb.b / 255);

  return {
    x: (r * 0.4124 + g * 0.3576 + b * 0.1805) * 100,
    y: (r * 0.2126 + g * 0.7152 + b * 0.0722) * 100,
    z: (r * 0.0193 + g * 0.1192 + b * 0.9505) * 100,
  };
}

function pivotRgb(value: number) {
  return value > 0.04045
    ? ((value + 0.055) / 1.055) ** 2.4
    : value / 12.92;
}

function pivotXyz(value: number) {
  return value > 0.008856 ? value ** (1 / 3) : 7.787 * value + 16 / 116;
}

function pickReadableText(rgb: RgbColor) {
  const luminance =
    (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;

  return luminance > 0.62 ? "rgba(15, 23, 42, 0.84)" : "rgba(248, 250, 252, 0.94)";
}
