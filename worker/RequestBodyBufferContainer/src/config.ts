export type AppConfig = {
  port: number;
  maxSizeBytes: number;
  ttlSeconds: number;
  internalSecret: string;
  logLevel: string;
};

export function getConfig(): AppConfig {
  return {
    port: parseInt(process.env.PORT ?? "8000", 10),
    maxSizeBytes: parseInt(
      process.env.MAX_SIZE_BYTES ?? `${256 * 1024 * 1024}`,
      10
    ),
    ttlSeconds: parseInt(process.env.TTL_SECONDS ?? "120", 10),
    internalSecret: process.env.INTERNAL_SECRET ?? "",
    logLevel: process.env.LOG_LEVEL ?? "info",
  };
}
