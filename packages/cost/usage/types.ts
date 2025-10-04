export interface ModelUsage {
  input: number;
  output: number;
  image?: number;
  cacheDetails?: {
    cachedInput: number;
    write5m?: number;
    write1h?: number;
  };
  cacheDurationHours?: number;
  thinking?: number;
  audio?: number;
  video?: number;
  web_search?: number;
}
