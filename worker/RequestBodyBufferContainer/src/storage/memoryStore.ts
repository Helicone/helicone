import type { StoredEntry } from "../types";

export class MemoryStore {
  private store = new Map<string, StoredEntry>();
  private readonly ttlSeconds: number;

  constructor(ttlSeconds: number) {
    this.ttlSeconds = ttlSeconds;
    // periodic cleanup every minute
    setInterval(
      () => this.cleanup(),
      Math.min(this.ttlSeconds, 60) * 1000
    ).unref?.();
  }

  set(requestId: string, data: Buffer): number {
    const size = data.byteLength;
    const expiresAt = Date.now() + this.ttlSeconds * 1000;
    this.store.set(requestId, { data, size, expiresAt });
    return size;
  }

  get(requestId: string): StoredEntry | undefined {
    const v = this.store.get(requestId);
    if (!v) return undefined;
    if (v.expiresAt < Date.now()) {
      this.store.delete(requestId);
      return undefined;
    }
    return v;
  }

  delete(requestId: string): void {
    this.store.delete(requestId);
  }

  has(requestId: string): boolean {
    return this.get(requestId) !== undefined;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [k, v] of this.store.entries()) {
      if (v.expiresAt < now) this.store.delete(k);
    }
  }
}
