import { logger } from "@/lib/telemetry/logger";

export function enforceString(value: unknown): string {
  if (typeof value !== "string") {
    logger.error(
      { value, type: typeof value },
      "Expected string, got different type",
    );
    return "";
  }
  return value;
}
