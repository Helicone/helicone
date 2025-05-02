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
}

export type SettingName = keyof SettingsType;

export type Setting = KafkaSettings | AzureExperiment | ApiKey;

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
        return this.settingsCache.get(name) as SettingsType[T] | undefined;
      }

      return setting;
    } catch (error) {
      console.error("Failed to get setting", error);
      return;
    }
  }
}
