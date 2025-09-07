export type NormalizedJawnResponse<T> = {
  error?: { error: string };
  data?: { data: T };
};

export function normalizeJawnResponse<T>(response: unknown): NormalizedJawnResponse<T> {
  const res = response as { data?: { data?: T; error?: string } } | undefined;
  const normalized: NormalizedJawnResponse<T> = {};
  if (res?.data?.error) {
    normalized.error = { error: res.data.error };
  }
  if (res?.data?.data) {
    normalized.data = { data: res.data.data };
  }
  return normalized;
}


