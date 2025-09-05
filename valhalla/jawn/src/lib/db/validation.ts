import { z, ZodType } from "zod";

export function validateRowsWithSchema<T>(raw: unknown, schema?: ZodType<T>): { ok: true; data: T[] } | { ok: false; error: string } {
  if (!schema) {
    return { ok: true, data: raw as T[] };
  }
  const parsed = z.array(schema).safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: `Zod validation failed: ${parsed.error.message}` };
  }
  return { ok: true, data: parsed.data };
}
