export type AppConfig = {
  port: number;
  maxSizeBytes: number;
  ttlSeconds: number;
  logLevel: string;
  enableUnsafeRead: boolean;
};

export function getConfig(): AppConfig {
  return {
    port: parseInt(process.env.PORT ?? "8000", 10),
    maxSizeBytes: parseInt(
      process.env.MAX_SIZE_BYTES ?? `${256 * 1024 * 1024}`,
      10
    ),
    ttlSeconds: parseInt(process.env.TTL_SECONDS ?? "120", 10),
    logLevel: process.env.LOG_LEVEL ?? "info",
    enableUnsafeRead: (process.env.ENABLE_UNSAFE_READ ?? "true").toLowerCase() === "true",
  };
}
