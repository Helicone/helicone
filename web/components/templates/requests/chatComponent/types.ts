export type Message = {
  id: string;
  role: "assistant" | "user" | "system" | "function";
  content: string | null | any[];
  function_call?: {
    name: string;
    arguments: string;
  };
  tool_calls?: any[];
  name?: string;
  model?: string;
  latency?: number;
};
