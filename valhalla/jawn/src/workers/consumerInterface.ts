import { Worker } from "worker_threads";

export function startConsumers({
  normalCount,
  dlqCount,
  scoresCount,
  scoresDlqCount,
  backFillCount,
}: {
  normalCount: number;
  dlqCount: number;
  scoresCount: number;
  scoresDlqCount: number;
  backFillCount: number;
}) {
  for (let i = 0; i < normalCount; i++) {
    const worker = new Worker(`${__dirname}/kafkaConsumer.js`);
    worker.postMessage("start");
  }

  for (let i = 0; i < dlqCount; i++) {
    const workerDlq = new Worker(`${__dirname}/kafkaConsumer.js`);
    workerDlq.postMessage("start-dlq");
  }

  for (let i = 0; i < scoresCount; i++) {
    const workerScores = new Worker(`${__dirname}/kafkaConsumer.js`);
    workerScores.postMessage("start-scores");
  }

  for (let i = 0; i < scoresDlqCount; i++) {
    const workerScoresDlq = new Worker(`${__dirname}/kafkaConsumer.js`);
    workerScoresDlq.postMessage("start-scores-dlq");
  }

  for (let i = 0; i < backFillCount; i++) {
    const workerBackFill = new Worker(`${__dirname}/kafkaConsumer.js`);
    workerBackFill.postMessage("start-backfill");
  }
}
