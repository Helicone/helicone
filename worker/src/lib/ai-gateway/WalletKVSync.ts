// Basically a lightweight wrapper around env.WALLET_KV so that we can make our code more readable

interface WalletState {
  remainingBalanceCents: number;
}

export class WalletKVSync {
  private walletState: WalletState | null = null;
  constructor(
    private walletKV: KVNamespace,
    private orgId: string
  ) {}

  private get key(): string {
    return `wallet:${this.orgId}`;
  }

  async getWalletState(): Promise<WalletState | null> {
    if (this.walletState) {
      return this.walletState;
    }

    try {
      const stored = await this.walletKV.get(this.key);
      if (stored) {
        this.walletState = JSON.parse(stored) as WalletState;
        return this.walletState;
      }
    } catch (error) {
      console.error(`Failed to get wallet state for ${this.orgId}:`, error);
    }

    return null;
  }

  async storeWalletState(remainingBalanceCents: number): Promise<void> {
    this.walletState = { remainingBalanceCents };
    try {
      await this.walletKV.put(this.key, JSON.stringify(this.walletState), {
        expirationTtl: 60 * 5, // Store for 5 minutes
      });
    } catch (error) {
      console.error(`Failed to store wallet state for ${this.orgId}:`, error);
    }
  }
}
