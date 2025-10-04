export interface WalletState {
  balance: number;
  effectiveBalance: number;
  totalCredits: number;
  totalDebits: number;
  totalEscrow: number;
  disallowList: Array<{
    helicone_request_id: string;
    provider: string;
    model: string;
  }>;
}
