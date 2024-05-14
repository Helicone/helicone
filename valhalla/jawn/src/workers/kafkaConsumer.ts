import { parentPort } from "worker_threads";
import { consume } from "./../lib/clients/KafkaConsumer";

parentPort?.once("message", (message) => {
  if (message === "start") {
    console.log("Kafka consumer thread started!");
    consume();
  }
});
