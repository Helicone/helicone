import { parentPort } from "worker_threads";
import {
  consumeHeliconeScores,
  consumeHeliconeScoresDlq,
  consumeRequestResponseLogs,
  consumeRequestResponseLogsDlq,
  consumeRequestResponseLogsLowPriority,
} from "../lib/clients/sqsConsumers/sqsConsumers";

parentPort?.once("message", (message) => {
  if (message === "start") {
    console.log("Sqs consumer thread started!");
    consumeRequestResponseLogs();
  } else if (message === "start-low") {
    console.log("Sqs consumer thread started!");
    consumeRequestResponseLogsLowPriority();
  } else if (message === "start-dlq") {
    console.log("Sqs DLQ consumer thread started!");
    consumeRequestResponseLogsDlq();
  } else if (message === "start-scores") {
    if (!process.env.DISABLE_NON_REQUEST_CONSUMERS) {
      console.log("Sqs scores consumer thread started!");
      consumeHeliconeScores();
    } else {
      console.log("Scores consumer disabled via DISABLE_NON_REQUEST_CONSUMERS");
    }
  } else if (message === "start-scores-dlq") {
    if (!process.env.DISABLE_NON_REQUEST_CONSUMERS) {
      console.log("Sqs scores DLQ consumer thread started!");
      consumeHeliconeScoresDlq();
    } else {
      console.log(
        "Scores DLQ consumer disabled via DISABLE_NON_REQUEST_CONSUMERS",
      );
    }
  } else if (message === "start-backfill") {
    throw new Error("Not implemented");
  }
});
