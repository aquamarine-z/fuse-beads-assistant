export const PATTERN_STUDIO_STORAGE_KEY = "fuse-pattern-studio-state";
export const PATTERN_EXPORT_CHANNEL = "fuse-pattern-export-channel";
export const PATTERN_STUDIO_ID_KEY = "fuse-pattern-studio-id";

export type PatternStudioPersistedState = {
  targetWidth: number;
  targetHeight: number;
  imageAreaWidth: number;
  imageAreaHeight: number;
  fitMode: "contain" | "cover" | "stretch";
  colorMergeTolerance: number;
  preferSquare: boolean;
  lockAspectRatio: boolean;
  lockImageAspectRatio: boolean;
  showCodes: boolean;
  cellSize: number;
  activeTab: string;
  imageStorageKey: string;
  imageTitle: string;
  sourceSummary: string;
};

export type PatternExportTransferState = PatternStudioPersistedState & {
  exportKey: string;
  imageUrl: string;
};

export function persistPatternStudioState(state: PatternStudioPersistedState) {
  try {
    window.sessionStorage.setItem(PATTERN_STUDIO_STORAGE_KEY, JSON.stringify(state));
    return "full" as const;
  } catch {
    try {
      window.sessionStorage.setItem(
        PATTERN_STUDIO_STORAGE_KEY,
        JSON.stringify(state)
      );
      return "full" as const;
    } catch {
      window.sessionStorage.removeItem(PATTERN_STUDIO_STORAGE_KEY);
      return "failed" as const;
    }
  }
}
