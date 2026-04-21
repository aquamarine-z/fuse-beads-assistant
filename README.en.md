# Fuse Beads Assistant

[中文](./README.md) | [English](./README.en.md) | [日本語](./README.ja.md) | [한국어](./README.ko.md)

A fuse beads pattern studio built with Next.js 16, React 19, shadcn/ui, and `next-intl`.

Its main feature is converting an uploaded image into a bead pattern based on the **Mard 221** palette, with preview, coded chart, color counts, and large export support.

## Highlights

- Import `PNG / JPG / WEBP` images and convert them into bead patterns
- Use [public/Mard221.csv](/Z:/development/projects/typescript/fuse-beads-assistant/public/Mard221.csv) as the palette source
- Switch between `Preview`, `Coded Chart`, `Coded Chart with Colors`, and `Source`
- Separate board size from image area size
- Square-first workflow enabled by default
- Merge similar colors with a tolerance slider
- Choose between `smooth` and `precise` sampling
- Open a dedicated large export page
- Support `zh / en / ja / ko`
- Global light, dark, system, and accent theme switching

## Routes

Home:

- `/zh`
- `/en`
- `/ja`
- `/ko`

Pattern studio:

- `/zh/pattern`
- `/en/pattern`
- `/ja/pattern`
- `/ko/pattern`

Large export:

- `/zh/pattern/export`
- `/en/pattern/export`
- `/ja/pattern/export`
- `/ko/pattern/export`

The root path `/` redirects to the default locale.

## Pattern Workflow

### 1. Image to Pattern

After importing an image, the studio generates:

- `Preview`
  Quantized bead-style preview
- `Coded Chart`
  Grid chart with color codes
- `Coded Chart with Colors`
  Coded chart plus bead counts per color
- `Source`
  Original image reference

### 2. Board Size and Image Area

The generator treats these as separate dimensions:

- `Board Size`
  Final bead grid size
- `Image Area Size`
  The area used to place and convert the source image

The image is fitted inside the image area first, then centered inside the board. Remaining board space is filled with `H2`.

This makes it easier to:

- keep the subject centered
- add clean margins on larger boards
- build rectangular boards without shifting the main subject

### 3. Defaults

- Default board size: `52 x 52`
- Square-first is enabled by default
- Built-in presets:
  - `52 x 52`
  - `104 x 104`
  - `52 x 104`
  - `104 x 52`

### 4. Fit Modes

- `Contain`
- `Cover`
- `Stretch`

### 5. Color Mapping

The app:

- reads color tags and hex values from `Mard221.csv`
- converts pixel colors into a comparison-friendly color space
- maps pixels to the nearest palette color
- optionally merges nearby colors with a tolerance setting

You can also switch sampling modes depending on whether you want a smoother or more literal result.

## Large Export

The studio can open a dedicated large export page.

The export view includes:

- a full-size chart outside the normal studio width
- coordinate labels
- optional title
- board size and image area size information
- color code toggle
- color counts under the chart
- direct image download

The export page redraws from the current studio configuration so the result stays consistent with the working view.

## Persistence Rules

### Preserved within the current tab

- board size
- image area size
- fit mode
- square-first and ratio lock
- active tab
- zoom-related settings
- image title and lightweight config
- current imported image

### Storage approach

- lightweight studio config is stored in `sessionStorage`
- image data is stored in `IndexedDB`
- switching locale, theme, or export page within the same tab keeps the image available

### Not preserved

- closing the page or browser tab should not resurrect old images

This avoids quota issues caused by storing large images directly in `sessionStorage`.

## Internationalization

The app uses `next-intl`.

Message files:

- [messages/zh.json](/Z:/development/projects/typescript/fuse-beads-assistant/messages/zh.json)
- [messages/en.json](/Z:/development/projects/typescript/fuse-beads-assistant/messages/en.json)
- [messages/ja.json](/Z:/development/projects/typescript/fuse-beads-assistant/messages/ja.json)
- [messages/ko.json](/Z:/development/projects/typescript/fuse-beads-assistant/messages/ko.json)

## Theme System

Global controls include:

- locale switching
- light / dark / system mode
- accent color switching

Current accent themes:

- `Peach`
- `Teal`
- `Violet`
- `Amber`
- `Rose`
- `Blush`
- `Mint`
- `Sage`

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Base UI
- `next-intl`

## Project Structure

```txt
app/
  [locale]/
    page.tsx
    pattern/page.tsx
    pattern/export/page.tsx
  layout.tsx
  page.tsx

components/
  locale-switcher.tsx
  pattern-export-viewer.tsx
  pattern-studio.tsx
  theme-switcher.tsx
  titlebar-controls.tsx
  ui/

i18n/
  navigation.ts
  request.ts
  routing.ts

lib/
  bead-pattern.ts
  pattern-image-store.ts
  pattern-studio-state.ts

messages/
  zh.json
  en.json
  ja.json
  ko.json

public/
  Mard221.csv
```

## Key Files

- Pattern generation:
  [lib/bead-pattern.ts](/Z:/development/projects/typescript/fuse-beads-assistant/lib/bead-pattern.ts)
- Studio UI:
  [components/pattern-studio.tsx](/Z:/development/projects/typescript/fuse-beads-assistant/components/pattern-studio.tsx)
- Export page:
  [components/pattern-export-viewer.tsx](/Z:/development/projects/typescript/fuse-beads-assistant/components/pattern-export-viewer.tsx)
- Lightweight state:
  [lib/pattern-studio-state.ts](/Z:/development/projects/typescript/fuse-beads-assistant/lib/pattern-studio-state.ts)
- Image persistence:
  [lib/pattern-image-store.ts](/Z:/development/projects/typescript/fuse-beads-assistant/lib/pattern-image-store.ts)

## Local Development

Install dependencies:

```bash
pnpm install
```

Start the dev server:

```bash
pnpm dev
```

Default URL:

```txt
http://localhost:3000
```

## Production Build

```bash
pnpm build
pnpm start
```

## Possible Next Steps

- limit the maximum number of colors
- split large designs across boards
- add print pagination
- export JSON / CSV chart data
- support alternate brand palettes

## Status

The current version has passed production build verification:

```bash
pnpm run build
```
