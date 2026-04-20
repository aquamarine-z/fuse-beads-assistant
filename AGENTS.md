# AGENTS.md

## Project

Fuse beads assistant built with:

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- `next-intl`

Primary feature: convert an uploaded image into a Mard 221 fuse bead pattern.

## Key Routes

- `/[locale]`
- `/[locale]/pattern`
- `/[locale]/pattern/export`

Supported locales:

- `zh`
- `en`
- `ja`
- `ko`

## Important Files

- `/Z:/development/projects/typescript/fuse-beads-assistant/components/pattern-studio.tsx`
  Main studio page and most UI logic.
- `/Z:/development/projects/typescript/fuse-beads-assistant/components/pattern-export-viewer.tsx`
  Large export page.
- `/Z:/development/projects/typescript/fuse-beads-assistant/lib/bead-pattern.ts`
  Pattern generation and canvas rendering.
- `/Z:/development/projects/typescript/fuse-beads-assistant/lib/pattern-studio-state.ts`
  Lightweight persisted studio state.
- `/Z:/development/projects/typescript/fuse-beads-assistant/lib/pattern-image-store.ts`
  Image persistence using same-tab memory cache + IndexedDB.
- `/Z:/development/projects/typescript/fuse-beads-assistant/messages/*.json`
  i18n copy.
- `/Z:/development/projects/typescript/fuse-beads-assistant/README.md`
  User-facing project summary.

## Current Product Behavior

### Pattern Studio

- Upload image and convert using `public/Mard221.csv`.
- Board size and image area size are separate.
- Square-first is enabled by default.
- Default board is `52 x 52`.
- Board presets include `52x52`, `104x104`, `52x104`, `104x52`.
- Image area sliders now use `0..board width/height`.
- If image area becomes `0`, generation safely falls back to background-only `H2`.
- Fit modes:
  - `contain`
  - `cover`
  - `stretch`

### Tabs

Studio has 4 tabs:

- Preview
- Coded chart
- Coded chart with colors
- Source

Important tab UI note:

- `components/ui/tabs.tsx` provides default fixed-height behavior.
- In studio we explicitly override with `!h-auto` on `TabsList` and `TabsTrigger`.
- If tab items appear to overflow again, inspect local class overrides first before changing the shared tabs component.

### Export Page

- Separate route from studio.
- Large export redraws from the same generation algorithm, not from a screenshot of a studio tab.
- Export includes:
  - optional title
  - board size
  - image area size
  - coordinate labels
  - legend / bead counts
  - optional code visibility toggle

## Persistence Rules

### Session / Browser Behavior

- User wants image preserved within the current browser tab flow.
- User does not want old images restored after fully closing the page/browser.
- Language/theme switches should preserve the current image.

### Current Implementation

- Lightweight studio config is stored in `sessionStorage`.
- Image binary/data URL is not stored in `sessionStorage`.
- Image is stored by key in IndexedDB.
- `lib/pattern-image-store.ts` also keeps a same-tab memory cache to avoid image loss during quick route/locale transitions.
- `pattern-studio.tsx` has an `isStateRestored` gate so initial empty state does not overwrite saved session data before restore completes.

If you touch persistence:

- Do not move large pattern blobs back into `sessionStorage`.
- Be careful not to reintroduce quota errors.
- Preserve the “same tab keeps image / full browser close should not resurrect stale image” intent.

## Important User Preferences

- UI should stay shadcn-based and visually polished.
- Style should feel close to Material 3 expressive.
- Theme color switching exists globally.
- Dark/light mode exists globally.
- Recommendations:
  - preserve current desktop layout
  - keep mobile layout visually coherent
  - do not casually revert previous UX tweaks

### Pattern Semantics

- Board size and image area are distinct concepts.
- Remaining board area should be filled with `H2`.
- Subject should stay centered within image area and board.
- Export correctness matters more than clever shortcuts.

## Known Sensitive Areas

### Image Restore

- Locale switching previously caused image loss.
- The current fix depends on:
  - `imageStorageKey`
  - IndexedDB read/write
  - same-tab memory cache
  - `isStateRestored` write gate

If image restore breaks again, inspect these first:

- `PatternStudio` restore effect
- `persistPatternStudioState(...)`
- `readPatternImageFromIndexedDb(...)`
- `savePatternImageToIndexedDb(...)`
- locale navigation behavior in `components/locale-switcher.tsx`

### Tab Layout

- Studio tab labels are multi-line in some languages.
- Height issues came from the interaction between custom grid layout and the shared tabs primitive styles.
- Avoid “quick fixes” with `overflow-hidden` on `TabsList`; it can clip translated labels.

### Large Boards

- The user asked for effectively unlimited board/image sizes.
- Code-side `200x200` limits were removed.
- Real limits are now browser/canvas/memory limits.

## Translation Guidance

- Keep all 4 locales in sync when changing feature text or labels.
- Bead count strings should use a space between count and unit where appropriate.
- The user is detail-oriented about i18n consistency.

## Git / Workspace Notes

- Repo may contain local IDE file `.idea/vcs.xml`; do not include it unless explicitly asked.
- Recent commits already exist for:
  - persistence and chart layout
  - studio controls and tab layout
  - home page feature messaging

## Safe Next Steps For Future Agents

- Prefer small, targeted edits in:
  - `pattern-studio.tsx`
  - `pattern-export-viewer.tsx`
  - `bead-pattern.ts`
  - locale message files
- Run `pnpm run build` after UI/state changes.
- When adjusting tabs, test long translated labels.
- When adjusting persistence, test:
  - upload image
  - switch locale
  - open export page
  - return to studio
  - refresh within same tab

