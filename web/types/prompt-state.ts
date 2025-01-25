import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export type HeliconeMessage =
  | ChatCompletionMessageParam
  | `<helicone-auto-prompt-input idx=${number} />`;

export type StateMessage = {
  role: "developer" | "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  idx?: number;
};

export interface PromptState {
  promptId: string;
  masterVersion: number;

  versionId: string; // The actual version ID (UUID) used for API calls
  version: number;

  messages: StateMessage[];
  parameters: Parameters;
  variables?: Variable[];
  evals?: EvalReference[];
  structure?: string; // TODO: Real structure when feature is added

  isDirty: boolean;
  response?: string;
}

export interface Parameters {
  provider: string;
  model: string;
  temperature: number;
  // TODO: Add more parameters
}
export interface Variable {
  name: string;
  value: string;
  isValid?: boolean;
  isMessage?: boolean;
  idx?: number;
}

export interface EvalReference {
  evalId: string;
  version: number;
}

export interface BaseEvalState {
  evalId: string;
  masterVersion: number;
  deleted: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface PythonEvalState extends BaseEvalState {
  type: "python";
  python: string;
}

export interface TypeScriptEvalState extends BaseEvalState {
  type: "typescript";
  typescript: string;
}

export interface ClassifierEvalState extends BaseEvalState {
  type: "classifier";
  classifier: string;
}

export type EvalState =
  | PythonEvalState
  | TypeScriptEvalState
  | ClassifierEvalState;
