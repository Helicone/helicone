import { parentPort } from "worker_threads";
import {
  consumeHeliconeScores,
  consumeHeliconeScoresDlq,
  consumeRequestResponseLogs,
  consumeRequestResponseLogsDlq,
} from "../lib/clients/sqsConsumers/sqsConsumers";

parentPort?.once("message", (message) => {
  if (message === "start") {
    console.log("Sqs consumer thread started!");
    consumeRequestResponseLogs();
  } else if (message === "start-dlq") {
    console.log("Sqs DLQ consumer thread started!");
    consumeRequestResponseLogsDlq();
  } else if (message === "start-scores") {
    console.log("Sqs scores consumer thread started!");
    consumeHeliconeScores();
  } else if (message === "start-scores-dlq") {
    console.log("Sqs scores DLQ consumer thread started!");
    consumeHeliconeScoresDlq();
  } else if (message === "start-backfill") {
    throw new Error("Not implemented");
  }
});
