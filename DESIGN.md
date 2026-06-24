---
name: Fuse Beads Assistant
description: A Material-inspired workspace for precise physical bead crafting.
colors:
  primary: "#b8422e"
  neutral-bg: "#fdfbf7"
  neutral-fg: "#4c4441"
  card: "#fffdfb"
  border: "#e6deda"
typography:
  display:
    fontFamily: "Segoe UI Variable Display, Aptos Display, Trebuchet MS, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3.5rem)"
    fontWeight: 600
    lineHeight: 1.15
  body:
    fontFamily: "Segoe UI Variable Text, Aptos, Trebuchet MS, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Cascadia Code, SFMono-Regular, Consolas, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
rounded:
  sm: "0.78rem"
  md: "1.04rem"
  lg: "1.3rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
---

# Design System: Fuse Beads Assistant

## 1. Overview

**Creative North Star: "The Material Workshop"**

"The Material Workshop" combines clean, tool-centric utility with an expressive and polished aesthetic. Drawing inspiration from modern Material Design, the interface utilizes vibrant accents, responsive transitions, and smooth background gradients to feel premium and alive. Spacing and typography are optimized to handle complex grids and bead count statistics without generating cognitive overload.

The design system explicitly rejects cluttered layouts, noisy decorative elements, and high-contrast styling tells (such as intense gradient text or flat, uninspired grays).

**Key Characteristics:**
- Tactile and expressive interactive elements with generous border-radii.
- Dynamic color personalization matching the user's active theme or accent choice.
- Focused and structured workspaces prioritizing chart legibility and physical bead mapping accuracy.

## 2. Colors

Colors adapt dynamically based on the active theme (e.g. light or dark mode) and chosen accent (Peach, Teal, Violet, Amber, Rose, Blush, Mint, or Sage).

### Primary
- **Active Accent** (`oklch` dynamic / defaults to `#b8422e`): Defines focus states, primary buttons, and key interactive outlines.

### Neutral
- **Warm Alabaster** (`oklch(0.984 0.009 34)` / `#fdfbf7`): The base light-mode background, providing a subtle, warm-tinted workspace.
- **Charcoal Clay** (`oklch(0.286 0.03 32)` / `#4c4441`): The primary light-mode ink, offering high readability without the harshness of pure black.
- **Card Neutral** (`oklch(0.996 0.006 25)` / `#fffdfb`): Raised container background in light mode.
- **Soft Sand** (`oklch(0.89 0.015 28)` / `#e6deda`): Standard light-mode border color.

### Named Rules
**The Single-Accent Rule.** Accent colors are applied intentionally and restrainedly. No more than 10% of any screen surface is saturated with the primary accent to maintain focus.
**The Dynamic Adaptation Rule.** The theme switching system maps background, foreground, borders, and accents consistently between dark and light modes, preserving brand coherence in all environments.

## 3. Typography

**Display Font:** Segoe UI Variable Display, Aptos Display (fallback: Trebuchet MS, sans-serif)
**Body Font:** Segoe UI Variable Text, Aptos (fallback: Trebuchet MS, sans-serif)
**Label/Mono Font:** Cascadia Code, SFMono-Regular (fallback: Consolas, monospace)

**Character:** The pairing of Segoe UI Variable Display and Cascadia Code blends editorial elegance with high technical precision, perfect for mapping digital pixel grids to physical bead patterns.

### Hierarchy
- **Display** (600, `clamp(2rem, 5vw, 3.5rem)`, 1.15): Used for page-level headers and major marketing hero text.
- **Headline** (600, `1.5rem`, 1.25): Section headings and key module titles.
- **Title** (500, `1.25rem`, 1.3): Subsections and modal headers.
- **Body** (400, `1rem`, 1.5): Standard descriptive copy and tool settings. Cap line lengths at 65–75ch for prose.
- **Label** (500, `0.875rem`): Button labels, select dropdowns, and form labels.
- **Code Chart** (500, dynamic font-size): Coded map coordinate characters and bead letters, using Cascadia Code for strict monospace alignment.

### Named Rules
**The Monospace-Align Rule.** All bead charts, coordinate legends, and bead color counts must use the monospace font stack to ensure neat tabular alignment and eliminate layout shift.

## 4. Elevation

The interface is layered with subtle borders, base gradients, and minimal box shadows. It relies on border colors and oklch background tones for separation rather than heavy shadows.

### Named Rules
**The Layer-Not-Shadow Rule.** Depth is established using color steps (e.g. Card background on top of Root background) and distinct border colors rather than deep shadows. Shadows are reserved exclusively for floating menus, dropdowns, and active tooltips.

## 5. Components

Components are styled to look tactile and expressive.

### Buttons
- **Shape:** Generous border-radius (1.3rem / 20.8px).
- **Primary:** Background uses `--primary`, text uses `--primary-foreground`. Padding is `8px 16px`.
- **Hover / Focus:** Interactive states use subtle scaling and transitions. Focus outline matches `--primary` with standard ring offset.

### Cards / Containers
- **Corner Style:** Rounded (1.3rem / 20.8px).
- **Background:** Uses `--card` in light mode and `--card` (darker oklch) in dark mode.
- **Border:** `1px` solid border (`--border`) to delineate edges cleanly.
- **Internal Padding:** Scaled from `16px` to `24px` depending on content density.

### Inputs / Fields
- **Style:** Background uses `--input` / transparent, rounded to match outer radii.
- **Focus:** Highlighted with a clear accent border and ring glow matching `--primary`.

### Navigation / Tabs
- **Style:** Overridden with `!h-auto` to allow multi-line translated text without clipping. Standard interactive transitions for active/inactive indicators.

## 6. Do's and Don'ts

### Do:
- **Do** use `text-wrap: balance` on display headings and `text-wrap: pretty` on body copy to ensure clean typographic lines.
- **Do** ensure contrast of body copy and code markers hits >= 4.5:1 against their backgrounds (especially chart codes overlaid on bead colors).
- **Do** maintain a consistent monospace font-family for all bead chart characters to align grid cells perfectly.

### Don't:
- **Don't** use side-stripe borders (borders > 1px on a single side) as callout decorations.
- **Don't** use gradient text under any circumstances.
- **Don't** animate image elements on hover. Backgrounds or borders may scale or change, but the target image should stay still.
- **Don't** truncate or clip tabs using `overflow-hidden` since translated labels (Chinese, Korean, English, Japanese) vary significantly in height and length.
