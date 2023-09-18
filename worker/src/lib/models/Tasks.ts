import { Result } from "../../results";

export interface Task {
  name: string;
  description?: string;
  id?: string;
  customProperties?: Record<string, string>;
  parentTaskId?: string;
  job: string;
}

export function validateTask(task: Task): Result<true, string> {
  if (!task.name) {
    return { data: null, error: "Missing run.name" };
  }

  if (typeof task.name !== "string") {
    return { data: null, error: "run.name must be a string" };
  }

  if (task.description && typeof task.description !== "string") {
    return { data: null, error: "run.description must be a string" };
  }

  if (task.id && typeof task.id !== "string") {
    return { data: null, error: "run.id must be a string" };
  }

  if (task.customProperties && typeof task.customProperties !== "object") {
    return {
      data: null,
      error: "run.customProperties must be an object",
    };
  }

  if (task.parentTaskId && typeof task.parentTaskId !== "string") {
    return {
      data: null,
      error: "run.parentTaskId must be a string",
    };
  }

  if (typeof task.job !== "string") {
    return {
      data: null,
      error: "run.run must be a string",
    };
  }

  return { data: true, error: null };
}
