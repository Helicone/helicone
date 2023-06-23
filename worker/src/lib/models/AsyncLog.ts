export type AsyncLogModel = {
  providerRequest: ProviderRequest;
  providerResponse: ProviderResponse;
  timing: Timing;
};

type ProviderRequest = {
  url: string;
  body: string;
  status: number;
  headers: Record<string, string>;
};

type ProviderResponse = {
  body: string;
  status: number;
  headers: Record<string, string>;
};

type Timing = {
  // From Unix epoch
  startTime: number;
  endTime: number;
}