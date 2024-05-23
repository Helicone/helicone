import { SupabaseClient } from "@supabase/supabase-js";
import { InMemoryCache } from "../lib/memoryCache/staticMemCache";
import { Database } from "../lib/db/database.types";
import { supabaseServer } from "../lib/db/supabase";

export type SettingName = "kafka:dlq" | "kafka:log";
export type Setting = KafkaDLQSettings | KafkaLogSettings;

export interface KafkaDLQSettings {
  miniBatchSize: number;
}

export interface KafkaLogSettings {
  miniBatchSize: number;
}

export interface SettingsType {
  "kafka:dlq": KafkaDLQSettings;
  "kafka:log": KafkaLogSettings;
}

class SettingsCache extends InMemoryCache {
  private static instance: SettingsCache;
  private API_KEY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
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
