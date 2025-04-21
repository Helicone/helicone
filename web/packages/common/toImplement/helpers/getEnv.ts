import { env } from "next-runtime-env";

export function getEnv(key: string) {
  const value = env(key);
  if (!value) {
    throw new Error(`Environment variable ${key} is not set.`);
  }
  return value;
}
