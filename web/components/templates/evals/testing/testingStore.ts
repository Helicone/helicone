import { TestConfig } from "./types";
import { devtools, persist } from "zustand/middleware";
import { create } from "zustand";
import { exTestInput } from "@/components/templates/evals/testing/examples";
import { Dispatch, SetStateAction } from "react";
import { TestInput } from "../CreateNewEvaluator/types";

interface TestDataState {
  testConfig: TestConfig | null;
  setTestConfig: Dispatch<SetStateAction<TestConfig | null>>;
  testInput: TestInput;
  setTestInput: Dispatch<SetStateAction<TestInput>>;
}

export const useTestDataStore = create<TestDataState>()(
  devtools(
    persist(
      (set) => ({
        testConfig: {
          _type: "llm",
          evaluator_llm_template: "",
          evaluator_scoring_type: "",
          evaluator_name: "",
          testInput: exTestInput,
        },
        setTestConfig: (by) => {
          if (typeof by === "function") {
            set((state) => ({ testConfig: by(state.testConfig) }));
          } else {
            set((state) => ({ testConfig: by }));
          }
        },
        testInput: {
          inputBody: "",
          outputBody: "",
          inputs: {
            inputs: {},
            autoInputs: {},
          },
        },
        setTestInput: (by) => {
          if (typeof by === "function") {
            set((state) => ({ testInput: by(state.testInput) }));
          } else {
            set((state) => ({ testInput: by }));
          }
        },
      }),
      {
        name: "test-data-storage",
      }
    )
  )
);
