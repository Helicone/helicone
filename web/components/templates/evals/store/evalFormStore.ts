import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface EvalFormState {
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
  hideFormButtons: boolean;
  setHideFormButtons: (hide: boolean) => void;
}

export const useEvalFormStore = create<EvalFormState>()(
  devtools(
    persist(
      (set) => ({
        isSubmitting: false,
        setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
        hideFormButtons: false,
        setHideFormButtons: (hide) => set({ hideFormButtons: hide }),
      }),
      {
        name: "eval-form-store",
      }
    )
  )
);
