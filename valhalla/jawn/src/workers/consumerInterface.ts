import { Worker } from "worker_threads";

export function startConsumers({
  normalCount,
  dlqCount,
  feedbackCount,
}: {
  normalCount: number;
  dlqCount: number;
  feedbackCount: number;
}) {
  for (let i = 0; i < normalCount; i++) {
    const worker = new Worker(`${__dirname}/kafkaConsumer.js`);
    worker.postMessage("start");
  }

  for (let i = 0; i < dlqCount; i++) {
    const workerDlq = new Worker(`${__dirname}/kafkaConsumer.js`);
    workerDlq.postMessage("start-dlq");
  }

  for (let i = 0; i < feedbackCount; i++) {
    const workerFeedback = new Worker(`${__dirname}/kafkaConsumer.js`);
    workerFeedback.postMessage("start-scores");
  }
}
