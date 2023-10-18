export const VALID_STATUS = ["RUNNING", "SUCCESS", "FAILED", "CANCELLED"];

export type JobStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "TIMEOUT"
  | "CANCELLED";
