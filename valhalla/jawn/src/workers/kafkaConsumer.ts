import { parentPort } from "worker_threads";
import { consume } from "./../lib/clients/KafkaConsumer";

parentPort?.once("message", (message) => {
  if (message === "start") {
    // consume();
    console.log("Starting Kafka Consumer");
  }
});
