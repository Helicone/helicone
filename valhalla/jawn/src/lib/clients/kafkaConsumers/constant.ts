export const AVG_MESSAGE_SIZE = 2_000; // 2kB
export const ESTIMATED_MINI_BATCH_COUNT = 3; // 3
export const MESSAGES_PER_MINI_BATCH = 300;
export const SCORES_MESSAGES_PER_MINI_BATCH = 300;

// DLQ
export const DLQ_ESTIMATED_MINI_BATCH_COUNT = 10;
export const DLQ_MESSAGES_PER_MINI_BATCH = +(
  process.env.DLQ_MESSAGES_PER_MINI_BATCH ?? 1
); // 1

export const DLQ_WORKER_COUNT = +(process.env.DLQ_WORKER_COUNT ?? 1);
export const NORMAL_WORKER_COUNT = +(process.env.NORMAL_WORKER_COUNT ?? 3);
export const SCORES_WORKER_COUNT = +(process.env.SCORES_WORKER_COUNT ?? 1);
