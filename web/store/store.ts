import { create } from "zustand";

type ExperimentsState = {
  openAddExperimentModal: boolean;
  setOpenAddExperimentModal: (open: boolean) => void;
};

// Create store instance once, outside of any component
export const useExperimentsStore = create<ExperimentsState>()((set) => ({
  openAddExperimentModal: false,
  setOpenAddExperimentModal: (open) => set({ openAddExperimentModal: open }),
}));
