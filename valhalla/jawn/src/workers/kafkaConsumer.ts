import { parentPort } from "worker_threads";
import { consume, consumeDlq } from "./../lib/clients/KafkaConsumer";

parentPort?.once("message", (message) => {
  if (message === "start") {
    console.log("Kafka consumer thread started!");
    consume();
  } else if (message === "start-dlq") {
    console.log("Kafka DLQ consumer thread started!");
    consumeDlq();
  }
});
