import { TestData } from "./types";
import { devtools, persist } from "zustand/middleware";
import { create } from "zustand";
import { exTestInput } from "@/components/templates/evals/testing/examples";
import { Dispatch, SetStateAction } from "react";

interface TestDataState {
  testData: TestData | null;
  setTestData: Dispatch<SetStateAction<TestData | null>>;
}

export const useTestDataStore = create<TestDataState>()(
  devtools(
    persist(
      (set) => ({
        testData: {
          _type: "llm",
          evaluator_llm_template: "",
          evaluator_scoring_type: "",
          evaluator_name: "",
          testInput: exTestInput,
        },
        setTestData: (by) => {
          if (typeof by === "function") {
            set((state) => ({ testData: by(state.testData) }));
          } else {
            set((state) => ({ testData: by }));
          }
        },
      }),
      {
        name: "test-data-storage",
      }
    )
  )
);
