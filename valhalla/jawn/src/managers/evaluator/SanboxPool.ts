import { CodeSandbox, CreateSandboxOpts, Sandbox } from "@codesandbox/sdk";

interface SandboxPoolOptions {
  concurrency: number; // max number of sandboxes you want running at once
  opts: CreateSandboxOpts;
  cache?: SandboxCache;
}

export interface SandboxCache {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  values(): Promise<string[]>;
  clear(): Promise<void>;
}

class InMemorySanboxCache implements SandboxCache {
  private cache = new Map<string, string>();

  public async get(key: string): Promise<string | null> {
    return this.cache.get(key) ?? null;
  }

  public async set(key: string, value: string): Promise<void> {
    this.cache.set(key, value);
  }

  public async values(): Promise<string[]> {
    return Array.from(this.cache.values());
  }

  public async clear(): Promise<void> {
    this.cache.clear();
  }
}

interface GetSandboxOptions {
  id: string; // some unique ID for the sandbox (e.g. "customer-1")
}

export class SandboxPool {
  private concurrency: number;
  private opts: CreateSandboxOpts;
  private activeCount = 0;

  private sandboxes: SandboxCache;
  private sdk: CodeSandbox;

  private waitingResolvers: Array<() => void> = [];

  constructor(options: SandboxPoolOptions) {
    this.sdk = new CodeSandbox();
    if (options.cache) {
      this.sandboxes = options.cache;
    } else {
      this.sandboxes = new InMemorySanboxCache();
    }
    this.concurrency = options.concurrency;
    this.opts = options.opts;

    process.on("SIGINT", () => {
      this.destroyPool();
    });

    process.on("SIGTERM", () => {
      this.destroyPool();
    });

    process.on("exit", () => {
      this.destroyPool();
    });
  }

  public async getSandbox({ id }: GetSandboxOptions): Promise<Sandbox> {
    let cachedId = await this.sandboxes.get(id);
    if (cachedId) {
      console.log("Sandbox already exists");
      return await this.sdk.sandbox.open(cachedId);
    }

    await this.waitForAvailability();
    cachedId = await this.sandboxes.get(id);

    // If someone else created it in the meantime, reuse
    if (cachedId) {
      console.log("Sandbox already exists");
      return await this.sdk.sandbox.open(cachedId);
    }

    this.activeCount++;

    let sandbox = await this.sdk.sandbox.create(this.opts);

    this.sandboxes.set(id, sandbox.id);

    return sandbox;
  }

  public async releaseSandbox(id: string): Promise<void> {
    const sandbox = await this.sandboxes.get(id);
    if (!sandbox) return;

    this.sdk.sandbox.shutdown(sandbox);
    this.release();
  }

  private async waitForAvailability(): Promise<void> {
    if (this.activeCount < this.concurrency) {
      return;
    }

    return new Promise((resolve) => {
      this.waitingResolvers.push(resolve);
    });
  }

  private release() {
    this.activeCount = Math.max(0, this.activeCount - 1);
    if (this.waitingResolvers.length > 0) {
      const next = this.waitingResolvers.shift();
      next && next();
    }
  }

  public async destroyPool() {
    console.log("Destroying pool");
    for (const sandbox of await this.sandboxes.values()) {
      this.sdk.sandbox.shutdown(sandbox);
    }
    this.sandboxes.clear();

    for (const waiting of this.waitingResolvers) {
      waiting();
    }
    this.waitingResolvers = [];

    this.activeCount = 0;
  }
}
