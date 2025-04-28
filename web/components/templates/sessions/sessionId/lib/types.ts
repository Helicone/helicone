export interface TimelineItem {
  id: string;
  section: string;
  startTime: number;
  endTime: number;
  label?: string;
  status?: "success" | "error";
  errorCode?: string;
  model?: string;
  cost?: number;
  latency?: string;
  prompt?: string;
  createdAt?: string;
  feedback?: "positive" | "negative";
}

export interface TimelineSection {
  id: string;
  label: string;
  cost?: number;
  latency?: string;
}
