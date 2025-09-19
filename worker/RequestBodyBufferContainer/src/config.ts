export type AppConfig = {
  port: number;
  maxSizeBytes: number;
  ttlSeconds: number;
  logLevel: string;
  enableUnsafeRead: boolean;
};

export const DEFAULT_TTL_SECONDS = 60 * 5; // 5 minutes

export function getConfig(): AppConfig {
  return {
    port: parseInt(process.env.PORT ?? "8000", 10),
    maxSizeBytes: parseInt(
      process.env.MAX_SIZE_BYTES ?? `${256 * 1024 * 1024}`, // 256MB
      10
    ),
    ttlSeconds: parseInt(
      process.env.TTL_SECONDS ?? DEFAULT_TTL_SECONDS.toString(),
      10
    ),
    logLevel: process.env.LOG_LEVEL ?? "info",
    enableUnsafeRead:
      (process.env.ENABLE_UNSAFE_READ ?? "true").toLowerCase() === "true",
  };
}
