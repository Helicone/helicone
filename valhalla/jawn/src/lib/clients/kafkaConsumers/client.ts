import * as Sentry from "@sentry/node";
import { Kafka, logLevel } from "kafkajs";

const KAFKA_CREDS = JSON.parse(process.env.KAFKA_CREDS ?? "{}");
const KAFKA_ENABLED = (KAFKA_CREDS?.KAFKA_ENABLED ?? "false") === "true";
const KAFKA_BROKER = KAFKA_CREDS?.UPSTASH_KAFKA_BROKER;
const KAFKA_USERNAME = KAFKA_CREDS?.UPSTASH_KAFKA_USERNAME;
const KAFKA_PASSWORD = KAFKA_CREDS?.UPSTASH_KAFKA_PASSWORD;
const LOCAL_KAFKA = KAFKA_CREDS?.LOCAL_KAFKA;

export function getKafka() {
  if (KAFKA_ENABLED && KAFKA_BROKER && KAFKA_USERNAME && KAFKA_PASSWORD) {
    return new Kafka({
      brokers: [KAFKA_BROKER],
      sasl: {
        mechanism: "scram-sha-512",
        username: KAFKA_USERNAME,
        password: KAFKA_PASSWORD,
      },
      ssl: true,
      logLevel: logLevel.ERROR,
    });
  } else if (KAFKA_ENABLED && LOCAL_KAFKA && KAFKA_BROKER) {
    return new Kafka({
      brokers: [KAFKA_BROKER],
      logLevel: logLevel.ERROR,
    });
  } else {
    if (!KAFKA_ENABLED) {
      Sentry.captureMessage("Kafka is disabled. Check environment variables.");
      console.log("Kafka is disabled.");
    } else {
      // Check which environment variables are missing
      console.error("Required Kafka environment variables are not set.");

      if (!KAFKA_BROKER) {
        console.error("KAFKA_BROKER is missing.");
        Sentry.captureMessage("KAFKA_BROKER is missing.");
      }
      if (!KAFKA_USERNAME) {
        console.error("KAFKA_USERNAME is missing.");
        Sentry.captureMessage("KAFKA_USERNAME is missing.");
      }
      if (!KAFKA_PASSWORD) {
        console.error("KAFKA_PASSWORD is missing.");
        Sentry.captureMessage("KAFKA_PASSWORD is missing.");
      }
    }
  }
}

export function generateKafkaAdmin() {
  const kafka = getKafka();
  return kafka?.admin();
}

export function generateKafkaConsumer(
  groupId:
    | "jawn-consumer-local-01"
    | "jawn-consumer"
    | "jawn-consumer-backfill"
    | "jawn-consumer-scores"
    | "jawn-consumer-scores-dlq"
) {
  const kafka = getKafka();
  const consumer = kafka?.consumer({
    groupId,
    heartbeatInterval: 3000,
    sessionTimeout: 3 * 60 * 1000, // 3 minutes
    maxBytes: 50_000_000, // 50MB ~ 10_000 messages
  });

  // DISCONNECT CONSUMER
  const errorTypes = ["unhandledRejection", "uncaughtException"];
  const signalTraps = ["SIGTERM", "SIGINT", "SIGUSR2"];

  errorTypes.forEach((type) => {
    process.on(type, async (e) => {
      try {
        console.log(`process.on ${type}`);
        console.error(e);
        await consumer?.disconnect();
        process.exit(0);
      } catch (_) {
        process.exit(1);
      }
    });
  });

  signalTraps.forEach((type) => {
    process.once(type, async () => {
      try {
        await consumer?.disconnect();
      } finally {
        process.kill(process.pid, type);
      }
    });
  });
  return consumer;
}
