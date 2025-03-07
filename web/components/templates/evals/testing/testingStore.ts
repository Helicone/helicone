import { TestConfig } from "./types";
import { devtools, persist } from "zustand/middleware";
import { create } from "zustand";
import { Dispatch, SetStateAction } from "react";
import { TestInput } from "../CreateNewEvaluator/types";

interface TestDataState {
  testConfig: TestConfig | null;
  setTestConfig: Dispatch<SetStateAction<TestConfig | null>>;
  testInput: TestInput;
  setTestInput: Dispatch<SetStateAction<TestInput>>;
  resetTestData: () => void;
}

// Default test data
const defaultTestConfig: TestConfig = {
  _type: "llm",
  evaluator_llm_template: "",
  evaluator_scoring_type: "",
  evaluator_name: "",
};

const defaultTestInput: TestInput = {
  inputBody: "",
  outputBody: "",
  inputs: {
    inputs: {},
    autoInputs: {},
  },
};

export const useTestDataStore = create<TestDataState>()(
  devtools(
    persist(
      (set) => ({
        testConfig: defaultTestConfig,
        setTestConfig: (by) => {
          if (typeof by === "function") {
            set((state) => ({ testConfig: by(state.testConfig) }));
          } else {
            set((state) => ({ testConfig: by }));
          }
        },
        testInput: defaultTestInput,
        setTestInput: (by) => {
          if (typeof by === "function") {
            set((state) => ({ testInput: by(state.testInput) }));
          } else {
            set((state) => ({ testInput: by }));
          }
        },
        resetTestData: () =>
          set({
            testConfig: defaultTestConfig,
            testInput: defaultTestInput,
          }),
      }),
      {
        name: "test-data-storage",
      }
    )
  )
);
