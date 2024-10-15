export function formatTimeString(timeString: string): string {
  return new Date(timeString).toISOString().replace("Z", "");
}

export function formatTimeStringDateTime(timeString: string): string {
  const date = new Date(timeString);
  return date.toISOString().split(".")[0].replace("T", " ");
}
