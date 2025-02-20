import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { Message, Tool } from "packages/llm-mapper/types";

export interface PromptState {
  promptId: string;
  masterVersion: number;

  versionId: string; // The actual version ID (UUID) used for API calls
  version: number;

  messages: Message[];
  parameters: StateParameters;
  variables?: StateVariable[];
  evals?: any[]; // TODO: Add evals to the state
  structure?: any; // TODO: Real structure when feature is added

  isDirty: boolean;
  response?: string;
  improvement?: { reasoning: string; content: string };
}

export type HeliconeMessage =
  | ChatCompletionMessageParam // OpenAI Chat Completion - from messages: []
  | { type: "text"; text: string } // Assistants API - from content: []
  | `<helicone-auto-prompt-input idx=${number} />`; // Helicone Auto Prompt Input - from messages: []

export interface StateParameters {
  provider: string;
  model: string;
  temperature: number;
  reasoning_effort?: "low" | "medium" | "high";
  tools?: Tool[];
  // TODO: Add more parameters
}

export interface StateVariable {
  name: string;
  value: string;
  isValid?: boolean;
  idx?: number;
}

export interface StateEval {}

// DB INTERFACE
export interface PromptVersionReference {
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
