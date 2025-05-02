import { QUEUE_NAMES } from "../clients/sqsConsumers/sqsConsumers";

export const QUEUE_URLS = {
  requestResponseLogs: `https://sqs.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_ACCOUNT_ID}/${QUEUE_NAMES.requestResponseLogs}`,
  heliconeScores: `https://sqs.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_ACCOUNT_ID}/${QUEUE_NAMES.heliconeScores}`,
  requestResponseLogsDlq: `https://sqs.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_ACCOUNT_ID}/${QUEUE_NAMES.requestResponseLogsDlq}`,
  heliconeScoresDlq: `https://sqs.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_ACCOUNT_ID}/${QUEUE_NAMES.heliconeScoresDlq}`,
} as const;
