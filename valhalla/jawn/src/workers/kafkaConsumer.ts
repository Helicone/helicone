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
    console.log("Kafka feedback consumer thread started!");
    consumeScores();
  }
});
