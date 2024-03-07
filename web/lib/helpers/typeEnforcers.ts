export function enforceString(value: unknown): string {
  if (typeof value !== "string") {
    console.error(`Expected string, got ${typeof value}`);
    return "";
  }
  return value;
}
