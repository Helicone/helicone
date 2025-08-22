import "helicone-api/tracer";
import "helicone-api/env";

import {
  DLQ_WORKER_COUNT,
  NORMAL_WORKER_COUNT,
  SCORES_WORKER_COUNT,
  startSQSConsumers,
  DelayedOperationService,
} from "helicone-api/consumers";

const KAFKA_CREDS = JSON.parse(process.env.KAFKA_CREDS ?? "{}");
const KAFKA_ENABLED = (KAFKA_CREDS?.KAFKA_ENABLED ?? "false") === "true";

async function startConsumers() {
  console.log("Starting Helicone Consumers Service...");

  if (!KAFKA_ENABLED) {
    console.error("KAFKA_ENABLED is not set to true. Exiting...");
    process.exit(1);
  }

  console.log("Starting Kafka/SQS consumers with configuration:");
  console.log(`  DLQ Workers: ${DLQ_WORKER_COUNT}`);
  console.log(`  Normal Workers: ${NORMAL_WORKER_COUNT}`);
  console.log(`  Scores Workers: ${SCORES_WORKER_COUNT}`);

  try {
    await startSQSConsumers({
      dlqCount: DLQ_WORKER_COUNT,
      normalCount: NORMAL_WORKER_COUNT,
      scoresCount: SCORES_WORKER_COUNT,
      scoresDlqCount: SCORES_WORKER_COUNT,
      lowCount: NORMAL_WORKER_COUNT,
      backFillCount: 0,
    });

    console.log("Consumers started successfully. Service is running...");

    // Keep the process alive
    setInterval(() => {
      // Heartbeat to keep process alive
    }, 1000);
  } catch (error) {
    console.error("Failed to start consumers:", error);
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string) {
  console.log(`Received ${signal}. Starting graceful shutdown...`);

  await DelayedOperationService.getInstance().executeShutdown();

  console.log("Graceful shutdown completed.");
  process.exit(0);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions and rejections
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Start the consumers
startConsumers().catch((error) => {
  console.error("Fatal error starting consumers:", error);
  process.exit(1);
});