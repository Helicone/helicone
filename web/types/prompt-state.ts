export type MessageRole = "developer" | "system" | "user" | "assistant";

export interface Message {
  role: MessageRole;
  content:
    | string
    | {
        type: "image_url";
        image_url: { url: string };
      };
}

export type Messages = Message[];

export interface PromptListItem {
  promptId: string;
  masterVersion: number;
  deleted?: boolean;
  updatedAt: string;
  description?: string;
}

export interface PromptState {
  promptId: string;
  masterVersion: number;

  version: number;

  messages: Messages;
  parameters: Parameters;
  variables?: Variable[];
  evals?: EvalReference[];
  structure?: string; // TODO: Real structure when feature is added

  isDirty: boolean;
  response?: string;
}

export interface Parameters {
  model: string;
  temperature: number;
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
