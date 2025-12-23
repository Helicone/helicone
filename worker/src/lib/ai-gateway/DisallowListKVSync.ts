import { DisallowListEntry } from "./types";

export class DisallowListKVSync {
  constructor(
    private kv: KVNamespace,
    private orgId: string
  ) {}

  private get key(): string {
    return `disallow_list:${this.orgId}`;
  }

  async getDisallowList(): Promise<DisallowListEntry[] | null> {
    try {
      const stored = await this.kv.get(this.key);
      if (stored) {
        return JSON.parse(stored) as DisallowListEntry[];
      }
    } catch (error) {
      console.error(`Failed to get disallow list for ${this.orgId}:`, error);
    }
    return null;
  }

  async storeDisallowList(list: DisallowListEntry[]): Promise<void> {
    try {
      await this.kv.put(this.key, JSON.stringify(list), {
        expirationTtl: 60 * 60 * 12, // 12 hours
      });
    } catch (error) {
      console.error(`Failed to store disallow list for ${this.orgId}:`, error);
    }
  }

  async invalidate(): Promise<void> {
    try {
      await this.kv.delete(this.key);
    } catch (error) {
      console.error(`Failed to invalidate disallow list for ${this.orgId}:`, error);
    }
  }
}
