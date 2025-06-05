import { TemplateWithInputs } from "@helicone/prompts/dist/objectParser";
import { Provider } from "../../..";
import { Result } from "../../util/results";

export const LOW_PRIORITY_QUEUE_URL =
  "https://sqs.us-east-1.amazonaws.com/placeholder";
export interface MessageProducer {
  sendMessage(msg: MessageData): Promise<Result<null, string>>;
  setLowerPriorityQueueUrl(queueUrl: string): void;
}

export type HeliconeMeta = {
  modelOverride?: string;
  omitRequestLog: boolean;
  omitResponseLog: boolean;
  webhookEnabled: boolean;
  posthogApiKey?: string;
  posthogHost?: string;
  lytixKey?: string;
  lytixHost?: string;
  heliconeManualAccessKey?: string;
};
export type MessageData = {
  id: string;
  authorization: string;
  heliconeMeta: HeliconeMeta;
  log: Log;
};

export type Log = {
  request: {
    id: string;
    userId: string;
    promptId?: string;
    promptVersion?: string;
    properties: Record<string, string>;
    heliconeApiKeyId?: number;
    heliconeProxyKeyId?: string;
    targetUrl: string;
    provider: Provider;
    bodySize: number;
    path: string;
    threat?: boolean;
    countryCode?: string;
    requestCreatedAt: Date;
    isStream: boolean;
    heliconeTemplate?: TemplateWithInputs;
    experimentColumnId?: string;
    experimentRowIndex?: string;
    cacheEnabled?: boolean;
    cacheSeed?: number;
    cacheBucketMaxSize?: number;
    cacheControl?: string;
    cacheReferenceId?: string;
  };
  response: {
    id: string;
    status: number;
    bodySize: number;
    timeToFirstToken?: number;
    responseCreatedAt: Date;
    delayMs: number;
    cachedLatency?: number;
  };
};
