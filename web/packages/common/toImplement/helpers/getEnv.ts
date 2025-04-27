import { env } from "next-runtime-env";

export function getEnv(key: string) {
  const value = env(key);
  if (!value) {
    null;
  }
  return value;
}
