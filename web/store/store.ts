import { create } from "zustand";
import { devtools } from "zustand/middleware";

type ExperimentsState = {
  openAddExperimentModal: boolean;
  setOpenAddExperimentModal: (open: boolean) => void;
};

// Create store instance once, outside of any component
export const useExperimentsStore = create<ExperimentsState>()(
  devtools(
    (set) => ({
      openAddExperimentModal: false,
      setOpenAddExperimentModal: (open) =>
        set({ openAddExperimentModal: open }),
    }),
    { name: "experiments-store", enabled: process.env.NODE_ENV !== "production" },
  ),
);
