import { Worker } from "worker_threads";

export function startSQSConsumers({
  normalCount,
  dlqCount,
  scoresCount,
  scoresDlqCount,
  backFillCount,
  lowCount,
}: {
  normalCount: number;
  dlqCount: number;
  scoresCount: number;
  scoresDlqCount: number;
  backFillCount: number;
  lowCount: number;
}) {
  for (let i = 0; i < normalCount; i++) {
    const worker = new Worker(`${__dirname}/sqsConsumer.js`);
    worker.postMessage("start");
  }
  for (let i = 0; i < lowCount; i++) {
    const worker = new Worker(`${__dirname}/sqsConsumer.js`);
    worker.postMessage("start-low");
  }

  for (let i = 0; i < dlqCount; i++) {
    const workerDlq = new Worker(`${__dirname}/sqsConsumer.js`);
    workerDlq.postMessage("start-dlq");
  }

  for (let i = 0; i < scoresCount; i++) {
    const workerScores = new Worker(`${__dirname}/sqsConsumer.js`);
    workerScores.postMessage("start-scores");
  }

  for (let i = 0; i < scoresDlqCount; i++) {
    const workerScoresDlq = new Worker(`${__dirname}/sqsConsumer.js`);
    workerScoresDlq.postMessage("start-scores-dlq");
  }

  for (let i = 0; i < backFillCount; i++) {
    const workerBackFill = new Worker(`${__dirname}/sqsConsumer.js`);
    workerBackFill.postMessage("start-backfill");
  }
}
