import { Result } from "../util/results";

export interface HeliconeNode {
  name: string;
  description?: string;
  id?: string;
  customProperties?: Record<string, string>;
  parentJobId?: string;
  job: string;
}

export function validateHeliconeNode(node: HeliconeNode): Result<true, string> {
  if (!node.name) {
    return { data: null, error: "Missing run.name" };
  }

  if (typeof node.name !== "string") {
    return { data: null, error: "run.name must be a string" };
  }

  if (node.description && typeof node.description !== "string") {
    return { data: null, error: "run.description must be a string" };
  }

  if (node.id && typeof node.id !== "string") {
    return { data: null, error: "run.id must be a string" };
  }

  if (node.customProperties && typeof node.customProperties !== "object") {
    return {
      data: null,
      error: "run.customProperties must be an object",
    };
  }

  if (node.parentJobId && typeof node.parentJobId !== "string") {
    return {
      data: null,
      error: "run.parentTaskId must be a string",
    };
  }

  if (typeof node.job !== "string") {
    return {
      data: null,
      error: "run.run must be a string",
    };
  }

  return { data: true, error: null };
}
