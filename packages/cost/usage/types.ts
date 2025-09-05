export interface ModelUsage {
  input: number;
  output: number;
  
  cacheTokens?: {
    cachedInput?: number;
    write5m?: number;
    write1h?: number;
  };
  
  thinking?: number;
  audio?: number;
  video?: number;
  web_search?: number;
  internal_reasoning?: number;
  
  request?: number;
  image?: number;
  
  total?: number;
  
  audioDetails?: {
    input?: number;
    output?: number;
  };
  cacheDetails?: {
    storageHours?: number;
  };
}