export type StoredEntry = {
  data: Buffer;
  size: number;
  expiresAt: number; // epoch millis
};

export type SignAwsInput = {
  region: string;
  forwardToHost: string;
  requestHeaders: Record<string, string>;
  method: string;
  urlString: string;
};

export type SignAwsOutput = {
  newHeaders: Record<string, string>;
  model: string;
};

