import { create } from "zustand";
import { persist } from "zustand/middleware";

export const MODE_LABELS = {
  rendered: "Rendered",
  raw: "Raw",
  json: "JSON",
  debug: "Debug",
} as const;
const MODES = Object.keys(MODE_LABELS) as (keyof typeof MODE_LABELS)[];

export type Mode = (typeof MODES)[number];

// Cycle through modes not including debug
export const cycleMode = (mode: Mode) => {
  const index = MODES.indexOf(mode);
  return MODES[(index + 1) % (MODES.length - 1)];
};

type RequestRenderModeState = {
  mode: Mode;
  setMode: (mode: Mode) => void;
  toggleMode: (isShiftPressed: boolean) => void;
};

export const useRequestRenderModeStore = create<RequestRenderModeState>()(
  persist(
    (set) => ({
      mode: "rendered",
      setMode: (mode) => set({ mode }),
      toggleMode: (isShiftPressed) =>
        set((state) => ({
          mode: isShiftPressed ? "debug" : cycleMode(state.mode),
        })),
    }),
    {
      name: "helicone-request-render-mode",
    }
  )
);
