import { InMemoryCache } from "../lib/cache/staticMemCache";
import { dbExecute } from "../lib/shared/db/dbExecute";

export interface KafkaSettings {
  miniBatchSize: number;
}

export interface AzureExperiment {
  azureBaseUri: string;
  azureApiVersion: string;
  azureDeploymentName: string;
  azureApiKey: string;
}

export interface OrgsToDLQ {
  orgs?: string[];
}

export interface ApiKey {
  apiKey: string;
}

export interface SqsSettings {
  messagesPerMiniBatch: number;
}

export interface StripeProductSettings {
  cloudGatewayTokenUsageProduct: string;
  cloudGatewayStorageUsageProduct: string; // For $6/GB byte-based billing
  pro20251210_79Price?: string; // $79/mo flat Pro (price_1ScuD5FeVmeixR9wXpK9BCki)
  team20251210_799Price?: string; // $799/mo flat Team (price_1ScuAvFeVmeixR9wmmzNz0kV)
}

export interface SettingsType {
  "kafka:dlq": KafkaSettings;
  "kafka:log": KafkaSettings;
  "kafka:score": KafkaSettings;
  "kafka:dlq:score": KafkaSettings;
  "kafka:dlq:eu": KafkaSettings;
  "kafka:log:eu": KafkaSettings;
  "kafka:orgs-to-dlq": OrgsToDLQ;
  "azure:experiment": AzureExperiment;
  "openai:apiKey": ApiKey;
  "anthropic:apiKey": ApiKey;
  "openrouter:apiKey": ApiKey;
  "togetherai:apiKey": ApiKey;
  "sqs:request-response-logs": SqsSettings;
  "sqs:helicone-scores": SqsSettings;
  "sqs:request-response-logs-dlq": SqsSettings;
  "sqs:helicone-scores-dlq": SqsSettings;
  "stripe:products": StripeProductSettings;
  // Stores provider/admin secrets; expected to include { helicone: string, ... }
  "secrets:provider-keys": Record<string, string>;
}

export type SettingName = keyof SettingsType;

export type Setting = KafkaSettings | AzureExperiment | ApiKey;

// TODO: Add default values for all SettingName types to prevent undefined returns
// when settings fail to load from database and don't exist in cache.
// Missing defaults for: kafka:dlq, kafka:log, kafka:score, kafka:dlq:score,
// kafka:dlq:eu, kafka:log:eu, kafka:orgs-to-dlq, azure:experiment, openai:apiKey,
// anthropic:apiKey, openrouter:apiKey, togetherai:apiKey, sqs:request-response-logs,
// sqs:helicone-scores, sqs:request-response-logs-dlq, sqs:helicone-scores-dlq
const DEFAULTS: Partial<Record<SettingName, any>> = {
  "stripe:products": {
    cloudGatewayTokenUsageProduct:
      process.env.STRIPE_CLOUD_GATEWAY_TOKEN_USAGE_PRODUCT,
    cloudGatewayStorageUsageProduct:
      process.env.STRIPE_CLOUD_GATEWAY_STORAGE_USAGE_PRODUCT,
  },
};
class SettingsCache extends InMemoryCache {
  private static instance: SettingsCache;
  private API_KEY_CACHE_TTL = 60 * 1000; // 1 minute
  constructor() {
    super(1_000);
  }

  static getInstance(): SettingsCache {
    if (!SettingsCache.instance) {
      SettingsCache.instance = new SettingsCache();
    }
    return SettingsCache.instance;
  }

  set<T>(key: string, value: T): void {
    super.set(key, value, this.API_KEY_CACHE_TTL);
  }
}

const settingsCache = SettingsCache.getInstance();

export class SettingsManager {
  private settingsCache: SettingsCache;

  constructor() {
    this.settingsCache = settingsCache;
  }

  private async loadSettings(): Promise<void> {
    const { data: settings, error: settingsErr } = await dbExecute<{
      created_at: string;
      id: string;
      name: string;
      settings: any;
    }>("SELECT * FROM helicone_settings", []);

    if (settingsErr !== null) {
      console.error("Failed to load settings", settingsErr);
      return;
    }

    for (const setting of settings) {
      this.settingsCache.set(setting.name, setting.settings);
    }
  }

  public async getSetting<T extends keyof SettingsType>(
    name: T
  ): Promise<SettingsType[T] | undefined> {
    try {
      const setting = this.settingsCache.get(name) as
        | SettingsType[T]
        | undefined;

      if (!setting) {
        await this.loadSettings();
        const res = this.settingsCache.get(name) as SettingsType[T] | undefined;
        if (res) {
          return res;
        } else {
          return DEFAULTS[name];
        }
      }

      return setting;
    } catch (error) {
      console.error("Failed to get setting", error);
      return;
    }
  }
}
