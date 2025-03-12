import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PromptRunsState {
  playgroundRunCount: number;
  promptRunCount: number;
  incrementPlaygroundRun: () => void;
  incrementPromptRun: () => void;
  resetCounts: () => void;
}

export const usePromptRunsStore = create<PromptRunsState>()(
  persist(
    (set) => ({
      playgroundRunCount: 0,
      promptRunCount: 0,
      incrementPlaygroundRun: () =>
        set((state) => ({ playgroundRunCount: state.playgroundRunCount + 1 })),
      incrementPromptRun: () =>
        set((state) => ({ promptRunCount: state.promptRunCount + 1 })),
      resetCounts: () => set({ playgroundRunCount: 0, promptRunCount: 0 }),
    }),
    {
      name: "prompt-runs-storage",
    }
  )
);
