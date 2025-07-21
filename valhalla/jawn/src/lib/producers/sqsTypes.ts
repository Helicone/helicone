export const QUEUE_NAMES = {
  requestResponseLogs:
    process.env.REQUEST_RESPONSE_LOGS_QUEUE_NAME ??
    "request-response-logs-queue",
  requestResponseLogsLowPriority:
    process.env.REQUEST_RESPONSE_LOGS_LOW_PRIORITY_QUEUE_NAME ??
    "request-response-logs-low",
  heliconeScores: "helicone-scores-queue",
  requestResponseLogsDlq: "request-response-logs-dlq",
  heliconeScoresDlq: "helicone-scores-dlq",
} as const;

export const QUEUE_URLS = {
  requestResponseLogs: `https://sqs.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_ACCOUNT_ID}/${QUEUE_NAMES.requestResponseLogs}`,
  requestResponseLogsLowPriority: `https://sqs.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_ACCOUNT_ID}/${QUEUE_NAMES.requestResponseLogsLowPriority}`,
  heliconeScores: `https://sqs.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_ACCOUNT_ID}/${QUEUE_NAMES.heliconeScores}`,
  requestResponseLogsDlq: `https://sqs.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_ACCOUNT_ID}/${QUEUE_NAMES.requestResponseLogsDlq}`,
  heliconeScoresDlq: `https://sqs.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_ACCOUNT_ID}/${QUEUE_NAMES.heliconeScoresDlq}`,
} as const;
