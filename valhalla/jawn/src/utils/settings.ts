import { SupabaseClient } from "@supabase/supabase-js";
import { InMemoryCache } from "../lib/cache/staticMemCache";
import { Database } from "../lib/db/database.types";
import { supabaseServer } from "../lib/db/supabase";

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
export interface SettingsType {
  "kafka:dlq": KafkaSettings;
  "kafka:log": KafkaSettings;
  "kafka:score": KafkaSettings;
  "kafka:dlq:score": KafkaSettings;
  "kafka:dlq:eu": KafkaSettings;
  "kafka:log:eu": KafkaSettings;
  "kafka:orgs-to-dlq": OrgsToDLQ;
  "azure:experiment": AzureExperiment;
}

export type SettingName = keyof SettingsType;

export type Setting = KafkaSettings | AzureExperiment;

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
  private client: SupabaseClient<Database>;

  constructor() {
    this.settingsCache = settingsCache;
    this.client = supabaseServer.client;
  }

  private async loadSettings(): Promise<void> {
    const { data: settings, error: settingsErr } = await this.client
      .from("helicone_settings")
      .select("*");

    if (settingsErr) {
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
