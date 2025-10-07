import { TemplateWithInputs } from "@helicone/prompts/dist/objectParser";
import { Provider } from "../../..";
import { Result } from "../../util/results";
import { ModelProviderName } from "@helicone-package/cost/models/providers";
import { ResponseFormat } from "@helicone-package/cost/models/types";

export interface MessageProducer {
  sendMessage(msg: MessageData): Promise<Result<null, string>>;
  setLowerPriority(): void;
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
  promptId?: string;
  promptVersionId?: string;
  promptInputs?: Record<string, any>;
  promptEnvironment?: string;
  stripeCustomerId?: string;
  
  // AI Gateway metadata
  isPassthroughBilling?: boolean;
  gatewayProvider?: ModelProviderName;
  
  gatewayModel?: string; // registry format
  providerModelId?: string; // provider format
  gatewayResponseFormat?: ResponseFormat;
  gatewayEndpointVersion?: string; // endpoint config version
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
    requestReferrer?: string;
  };
  response: {
    id: string;
    status: number;
    bodySize: number;
    timeToFirstToken?: number;
    responseCreatedAt: Date;
    delayMs: number;
    cachedLatency?: number;
    cost?: number;
  };
};
