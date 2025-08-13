import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  base: { service: "my-nextjs-app" }, // add a service name for search in logs
  transport:
    process.env.NODE_ENV === "production"
      ? undefined // JSON logs for ingestion
      : {
          target: "pino-pretty", // Pretty print in dev
          options: { colorize: true, translateTime: "SYS:standard" },
        },
});
