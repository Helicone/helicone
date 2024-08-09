import { parentPort } from "worker_threads";
import {
  consume,
  consumeDlq,
  consumeScores,
} from "../lib/clients/kafkaConsumers/KafkaConsumer";

parentPort?.once("message", (message) => {
  if (message === "start") {
    console.log("Kafka consumer thread started!");
    consume();
  } else if (message === "start-dlq") {
    console.log("Kafka DLQ consumer thread started!");
    consumeDlq();
  } else if (message === "start-scores") {
    console.log("Kafka scores consumer thread started!");
    consumeScores();
  } else if (message === "start-scores-dlq") {
    console.log("Kafka scores DLQ consumer thread started!");
    consumeScores(tue);
  }
});
