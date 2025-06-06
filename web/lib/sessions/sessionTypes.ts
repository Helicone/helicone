import { MappedLLMRequest } from "@helicone-package/llm-mapper/types";

export interface Trace {
  start_unix_timestamp_ms: number;
  end_unix_timestamp_ms: number;
  properties: Record<string, string>;
  path: string;
  request_id: string;
  request: MappedLLMRequest;
}

export interface Session {
  start_time_unix_timestamp_ms: number;
  end_time_unix_timestamp_ms: number;
  session_id: string;
  session_tags: string[];
  session_cost_usd: number;
  traces: Trace[];
}

export interface FolderNode {
  folderName: string;
  currentPath: string;
  children: (FolderNode | Trace)[];
}

export interface TraceNode {
  trace: Trace;
  children: TraceNode[];
  parents: TraceNode[];
}

export type HeliconeRequestType = "Tool" | "LLM" | "VectorDB";

export interface TreeNodeData {
  subPathName?: string;
  latency?: number;
  trace?: Trace;
  children?: TreeNodeData[];
  currentPath: string;
  heliconeRequestType?: HeliconeRequestType;
}
