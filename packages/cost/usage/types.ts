export interface ModalityUsage {
  input?: number;
  cachedInput?: number;
  output?: number;
}

export interface ModelUsage {
  // Text modality
  input: number;
  output: number;
  cacheDetails?: {
    cachedInput: number;
    write5m?: number;
    write1h?: number;
  };
  cacheDurationHours?: number;
  thinking?: number;

  // Other modality breakdowns
  image?: ModalityUsage;
  audio?: ModalityUsage;
  video?: ModalityUsage;
  file?: ModalityUsage;

  web_search?: number;

  // Direct USD cost from provider if available
  cost?: number;
}
