import { CodeSandbox, CreateSandboxOpts, Sandbox } from "@codesandbox/sdk";

interface SandboxPoolOptions {
  concurrency: number; // max number of sandboxes you want running at once
  opts: CreateSandboxOpts;
}

interface GetSandboxOptions {
  id: string; // some unique ID for the sandbox (e.g. "customer-1")
}

export class SandboxPool {
  private concurrency: number;
  private opts: CreateSandboxOpts;
  private activeCount = 0;

  private sandboxes = new Map<string, Sandbox>();

  private waitingResolvers: Array<() => void> = [];

  constructor(options: SandboxPoolOptions) {
    this.concurrency = options.concurrency;
    this.opts = options.opts;

    process.on("SIGINT", () => {
      this.destroyPool();
    });

    process.on("SIGTERM", () => {
      this.destroyPool();
    });
  }

  public async getSandbox({ id }: GetSandboxOptions): Promise<Sandbox> {
    if (this.sandboxes.has(id)) {
      return this.sandboxes.get(id)!;
    }

    await this.waitForAvailability();

    // If someone else created it in the meantime, reuse
    if (this.sandboxes.has(id)) {
      this.release();
      return this.sandboxes.get(id)!;
    }

    this.activeCount++;
    const sdk = new CodeSandbox();

    let sandbox = await sdk.sandbox.create(this.opts);

    this.sandboxes.set(id, sandbox);

    return sandbox;
  }

  public async releaseSandbox(id: string): Promise<void> {
    const sandbox = this.sandboxes.get(id);
    if (!sandbox) return;

    sandbox.shutdown();
    this.sandboxes.delete(id);
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
    for (const sandbox of this.sandboxes.values()) {
      sandbox.shutdown();
    }
    this.sandboxes.clear();

    for (const waiting of this.waitingResolvers) {
      waiting();
    }
    this.waitingResolvers = [];

    this.activeCount = 0;
  }
}
