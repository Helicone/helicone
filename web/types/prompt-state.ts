import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export type MessageRole = "developer" | "system" | "user" | "assistant";

export interface Message {
  role: string;
  content: string | object;
}

export type Messages = Message[];

export interface PromptListItem {
  promptId: string;
  masterVersion: number;
  deleted?: boolean;
  updatedAt: string;
  description?: string;
}

export interface PromptVersion {
  id: string;
  minor_version: number;
  major_version: number;
  prompt_v2: string;
  model: string;
  helicone_template: string;
  created_at: string;
  metadata: Record<string, any>;
  parent_prompt_version?: string | null;
  experiment_id?: string | null;
  updated_at?: string;
}

export interface PromptState {
  promptId: string;
  masterVersion: number;

  versionId: string; // The actual version ID (UUID) used for API calls
  version: number;

  messages: ChatCompletionMessageParam[];
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
