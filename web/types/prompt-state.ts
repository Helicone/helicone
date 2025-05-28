import { Provider } from "@helicone-package/cost/unified/types";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { Message, Tool } from "@helicone-package/llm-mapper/types";

export interface PromptState {
  promptId?: string; // The prompt ID (UUID)
  masterVersion?: number; // The master prompt version

  versionId?: string; // The prompt version ID (UUID)
  version?: number; // The version the user is currently editing

  messages: Message[];
  parameters: StateParameters;
  inputs?: StateInputs[];
  evals?: any[]; // TODO: Add evals to the state
  structure?: any; // TODO: Real zod structure when feature is added

  isDirty: boolean;
  response?: { content: string; reasoning: string; calls: string };
  improvement?: { reasoning: string; content: string };
}

export interface StateParameters {
  provider: Provider;
  model: string;
  temperature?: number;
  reasoning_effort?: "low" | "medium" | "high";
  max_tokens?: number;
  tools?: Tool[];
  stop?: string[];
  response_format?: { type: "json_schema"; json_schema?: object };
  // TODO: Add more parameters
}

export interface StateInputs {
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

// LEGACY: Pre-llm-mapper
export type HeliconeMessage =
  | ChatCompletionMessageParam // OpenAI Chat Completion - from messages: []
  | { type: "text"; text: string } // Assistants API - from content: []
  | `<helicone-auto-prompt-input idx=${number} />`; // Helicone Auto Prompt Input - from messages: []
