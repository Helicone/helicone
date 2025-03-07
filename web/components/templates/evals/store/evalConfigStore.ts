import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { LLMEvaluatorConfigFormPreset } from "../CreateNewEvaluator/LLMEvaluatorConfigForm";

// Default LLM config
const defaultLLMConfig: LLMEvaluatorConfigFormPreset = {
  name: "",
  description: "",
  expectedValueType: "boolean",
  includedVariables: {
    inputs: true,
    promptTemplate: false,
    inputBody: false,
    outputBody: true,
  },
  model: "gpt-4o",
};

interface EvalConfigState {
  // LLM Config
  llmConfig: LLMEvaluatorConfigFormPreset;
  setLLMConfig: (config: Partial<LLMEvaluatorConfigFormPreset>) => void;
  llmTemplate: string;
  setLLMTemplate: (template: string) => void;

  // Python Config
  pythonName: string;
  setPythonName: (name: string) => void;
  pythonDescription: string;
  setPythonDescription: (description: string) => void;
  pythonCode: string;
  setPythonCode: (code: string) => void;

  // LastMile Config
  lastMileName: string;
  setLastMileName: (name: string) => void;
  lastMileDescription: string;
  setLastMileDescription: (description: string) => void;
  lastMileConfig: any;
  setLastMileConfig: (config: any) => void;
}

export const useEvalConfigStore = create<EvalConfigState>()(
  devtools(
    persist(
      (set) => ({
        // LLM Config
        llmConfig: defaultLLMConfig,
        setLLMConfig: (config) =>
          set((state) => ({ llmConfig: { ...state.llmConfig, ...config } })),
        llmTemplate: "",
        setLLMTemplate: (template) => set({ llmTemplate: template }),

        // Python Config
        pythonName: "",
        setPythonName: (name) => set({ pythonName: name }),
        pythonDescription: "",
        setPythonDescription: (description) =>
          set({ pythonDescription: description }),
        pythonCode: "",
        setPythonCode: (code) => set({ pythonCode: code }),

        // LastMile Config
        lastMileName: "",
        setLastMileName: (name) => set({ lastMileName: name }),
        lastMileDescription: "",
        setLastMileDescription: (description) =>
          set({ lastMileDescription: description }),
        lastMileConfig: null,
        setLastMileConfig: (config) => set({ lastMileConfig: config }),
      }),
      {
        name: "eval-config-store",
      }
    )
  )
);
