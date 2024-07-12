import crypto from "crypto";

export function getValidUUID(uuid: string | undefined | null): string {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuid && uuidRegex.test(uuid)) {
    return uuid;
  }
  return crypto.randomUUID();
}
