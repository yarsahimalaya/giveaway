import type { ColumnMapping, LoadedFile } from "./csv";
import type { DrawSettings, Winner } from "./draw";
import type { Rules } from "./rules";

export type Step = "upload" | "rules" | "draw";

export interface SavedState {
  title: string;
  files: LoadedFile[];
  mapping: ColumnMapping;
  rules: Rules;
  settings: DrawSettings;
  winners: Winner[];
  step: Step;
}

const KEY = "winner-picker:v1";

export function loadState(): Partial<SavedState> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Partial<SavedState>) : {};
  } catch {
    return {};
  }
}

export function saveState(state: SavedState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Very large exports can blow the storage quota; keep everything except the rows.
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...state, files: [] }));
    } catch {
      // Storage unavailable (private mode, blocked site data) — the app still works, it just won't survive a refresh.
    }
  }
}

export function clearState() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
