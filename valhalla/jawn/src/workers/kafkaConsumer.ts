import { parentPort } from "worker_threads";
import {
  consume,
  consumeDlq,
  consumeScores,
  consumeScoresDlq,
} from "../lib/clients/kafkaConsumers/KafkaConsumer";

parentPort?.once("message", (message) => {
  if (message === "start") {
    console.log("Kafka consumer thread started!");
    consume({
      consumerName: "jawn-consumer",
    });
  } else if (message === "start-dlq") {
    console.log("Kafka DLQ consumer thread started!");
    consumeDlq();
  } else if (message === "start-scores") {
    console.log("Kafka scores consumer thread started!");
    consumeScores();
  } else if (message === "start-scores-dlq") {
    console.log("Kafka scores DLQ consumer thread started!");
    consumeScoresDlq();
  } else if (message === "start-backfill") {
    console.log("Kafka backfill consumer thread started!");
    consume({
      startTimestamp: new Date("2024-08-16T13:00:00-07:00").getTime(), // 8/15/2024 10:00 AM PST
      endTimestamp: new Date("2024-08-16T23:00:00-07:00").getTime(), // 8/16/2024 11:00 PM PST
      filter: {
        stream: "only-stream",
      },
      consumerName: "jawn-consumer-backfill",
    });
  }
});
