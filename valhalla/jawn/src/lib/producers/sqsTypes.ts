export const QUEUE_NAMES = {
  requestResponseLogs: "request-response-logs-queue",
  heliconeScores: "helicone-scores-queue",
  requestResponseLogsDlq: "request-response-logs-dlq",
  heliconeScoresDlq: "helicone-scores-dlq",
} as const;

export const QUEUE_URLS = {
  requestResponseLogs: `https://sqs.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_ACCOUNT_ID}/${QUEUE_NAMES.requestResponseLogs}`,
  heliconeScores: `https://sqs.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_ACCOUNT_ID}/${QUEUE_NAMES.heliconeScores}`,
  requestResponseLogsDlq: `https://sqs.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_ACCOUNT_ID}/${QUEUE_NAMES.requestResponseLogsDlq}`,
  heliconeScoresDlq: `https://sqs.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_ACCOUNT_ID}/${QUEUE_NAMES.heliconeScoresDlq}`,
} as const;
