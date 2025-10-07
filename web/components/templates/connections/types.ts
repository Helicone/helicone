export type IntegrationType =
  | "provider"
  | "other-provider"
  | "fine-tuning"
  | "destination"
  | "gateway";

export interface Integration {
  title: string;
  type: IntegrationType;
  configured: boolean;
  enabled: boolean;
}

export interface IntegrationSection {
  title: string;
  type: IntegrationType;
}
