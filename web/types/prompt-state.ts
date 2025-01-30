import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export type HeliconeMessage =
  | ChatCompletionMessageParam // OpenAI Chat Completion - from messages: []
  | { type: "text"; text: string } // Assistants API - from content: []
  | `<helicone-auto-prompt-input idx=${number} />`; // Helicone Auto Prompt Input - from messages: []

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
  variables?: StateVariable[];
  evals?: any[]; // TODO: Add evals to the state
  structure?: any; // TODO: Real structure when feature is added

  isDirty: boolean;
  response?: string;
  improvement?: { content: string; reasoning: string }; // Updated to store both content and reasoning
}

export interface Parameters {
  provider: string;
  model: string;
  temperature: number;
  // TODO: Add more parameters
}
export interface StateVariable {
  name: string;
  value: string;
  isValid?: boolean;
  idx?: number;
}

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
