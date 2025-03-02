/**
 * Shared types used across the application
 */

/**
 * Configuration options for webhooks
 */
export type WebhookConfig = {
  /**
   * Percentage of requests to send to the webhook (0-100)
   * @default 100
   */
  sampleRate?: number;

  /**
   * Whether to include additional data like cost and token counts
   * @default true
   */
  includeData?: boolean;

  /**
   * Filters to apply to properties before sending to webhook
   * Only sends webhook if all property filters match
   */
  propertyFilters?: Array<{
    key: string;
    value: string;
  }>;
};
