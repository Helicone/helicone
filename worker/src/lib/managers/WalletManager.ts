import retry from "async-retry";
import { DisallowListKVSync } from "../ai-gateway/DisallowListKVSync";
import { WalletKVSync } from "../ai-gateway/WalletKVSync";
import { SYNC_STALENESS_THRESHOLD, Wallet } from "../durable-objects/Wallet";
import { HeliconeProxyRequest } from "../models/HeliconeProxyRequest";
import { createDataDogTracer } from "../monitoring/DataDogTracer";
import { err, ok, Result } from "../util/results";

const RETRY_CONFIG = {
  retries: 3,
  minTimeout: 100,
  maxTimeout: 1000,
} as const;

export class WalletManager {
  private env: Env;
  walletStub: DurableObjectStub<Wallet>;
  private ctx: ExecutionContext;

  constructor(
    env: Env,
    ctx: ExecutionContext,
    walletStub: DurableObjectStub<Wallet>
  ) {
    this.env = env;
    this.ctx = ctx;
    this.walletStub = walletStub;
  }

  async finalizeEscrowAndSyncSpend(
    organizationId: string,
    proxyRequest: HeliconeProxyRequest,
    cost: number | undefined,
    statusCode: number
  ): Promise<Result<{ remainingBalance: number }, string>> {
    if (!proxyRequest.escrowInfo) {
      return err("No escrow info");
    }

    try {
      const escrowResult = await proxyRequest.escrowInfo.escrow;

      if (escrowResult.error) {
        return this.handleEscrowFailure(
          organizationId,
          proxyRequest,
          cost,
          escrowResult.error
        );
      }

      return this.finalizeSuccessfulEscrow(
        organizationId,
        proxyRequest,
        cost,
        statusCode,
        escrowResult.data.reservedEscrowId
      );
    } catch (error) {
      console.error("Error finalizing escrow:", error);
      return err(`Error finalizing escrow: ${error}`);
    }
  }

  private async handleEscrowFailure(
    organizationId: string,
    proxyRequest: HeliconeProxyRequest,
    cost: number | undefined,
    escrowError: { type: string; message: string; statusCode: number }
  ): Promise<Result<{ remainingBalance: number }, string>> {
    console.error("Escrow reservation failed", escrowError);

    // Try direct debit as fallback if we have a valid cost
    // Skip if escrow failed due to wallet suspension (disputes) - don't bypass the block
    const isWalletSuspended = escrowError.statusCode === 403;
    if (cost !== undefined && cost > 0 && !isWalletSuspended) {
      const directDebitResult = await this.tryDirectDebit(organizationId, cost);
      if (directDebitResult) {
        return ok({ remainingBalance: directDebitResult.remainingBalance });
      }
    }

    // Direct debit failed or wasn't attempted - log the failure
    this.traceOptimisticEscrowFailure(
      organizationId,
      proxyRequest,
      cost,
      escrowError
    );

    return err(escrowError.message);
  }

  private async tryDirectDebit(
    organizationId: string,
    cost: number
  ): Promise<{ remainingBalance: number } | null> {
    try {
      const result = await this.retryWalletOperation(
        () => this.walletStub.directDebit(organizationId, cost),
        "directDebit"
      );

      await this.updateWalletKV(organizationId, result.remainingBalance);

      console.log(
        `Escrow failed but direct debit succeeded for org ${organizationId}, cost: ${cost}`
      );

      return { remainingBalance: result.remainingBalance };
    } catch (error) {
      console.error("Direct debit fallback also failed", error);
      return null;
    }
  }

  private async finalizeSuccessfulEscrow(
    organizationId: string,
    proxyRequest: HeliconeProxyRequest,
    cost: number | undefined,
    statusCode: number,
    escrowId: string
  ): Promise<Result<{ remainingBalance: number }, string>> {
    const { clickhouseLastCheckedAt, remainingBalance, staleEscrowsCleared } =
      await this.retryWalletOperation(
        () =>
          this.walletStub.finalizeEscrow(organizationId, escrowId, cost ?? 0),
        "finalizeEscrow"
      );

    await this.updateWalletKV(organizationId, remainingBalance);

    if (staleEscrowsCleared !== undefined && staleEscrowsCleared > 0) {
      this.traceStaleEscrowCleanup(organizationId, staleEscrowsCleared);
    }

    await this.handleDisallowListIfNeeded(
      organizationId,
      proxyRequest,
      cost,
      statusCode
    );

    const timeSinceLastCheck = Date.now() - clickhouseLastCheckedAt;
    if (timeSinceLastCheck > SYNC_STALENESS_THRESHOLD) {
      await this.syncClickhouseSpend(
        organizationId,
        proxyRequest.requestWrapper.getRawProviderAuthHeader() ?? ""
      );
    }

    return ok({ remainingBalance });
  }

  private async retryWalletOperation<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    return retry(
      async (bail) => {
        try {
          return await operation();
        } catch (e) {
          if (
            e instanceof Error &&
            e.message.includes("cannot be negative")
          ) {
            bail(e);
            return undefined as never;
          }
          throw e;
        }
      },
      {
        ...RETRY_CONFIG,
        onRetry: (error, attempt) => {
          console.warn(
            `Retry attempt ${attempt} for ${operationName}. Error: ${error}`
          );
        },
      }
    );
  }

  private async updateWalletKV(
    organizationId: string,
    remainingBalance: number
  ): Promise<void> {
    const walletKVSync = new WalletKVSync(this.env.WALLET_KV, organizationId);
    await walletKVSync.storeWalletState(remainingBalance);
  }

  private async handleDisallowListIfNeeded(
    organizationId: string,
    proxyRequest: HeliconeProxyRequest,
    cost: number | undefined,
    statusCode: number
  ): Promise<void> {
    const shouldAddToDisallowList =
      cost === undefined &&
      statusCode >= 200 &&
      statusCode < 300 &&
      !proxyRequest.isStream;

    if (!shouldAddToDisallowList || !proxyRequest.escrowInfo) {
      return;
    }

    await this.walletStub.addToDisallowList(
      proxyRequest.requestId,
      proxyRequest.escrowInfo.endpoint.provider,
      proxyRequest.requestWrapper.getGatewayAttempt()?.endpoint
        .providerModelId ?? "*"
    );

    const disallowKVSync = new DisallowListKVSync(
      this.env.WALLET_KV,
      organizationId
    );
    await disallowKVSync.invalidate();
  }

  private traceOptimisticEscrowFailure(
    organizationId: string,
    proxyRequest: HeliconeProxyRequest,
    cost: number | undefined,
    escrowError: { type: string; message: string; statusCode: number }
  ): void {
    const escrowInfo = proxyRequest.escrowInfo;
    if (!escrowInfo) {
      console.error("Cannot trace escrow failure: escrowInfo is missing");
      return;
    }

    const tracer = createDataDogTracer(this.env);
    tracer.startTrace(
      "ptb.optimistic_escrow_failure",
      "escrow_failure",
      {
        org_id: organizationId,
        provider: escrowInfo.endpoint.provider,
        model: escrowInfo.endpoint.providerModelId,
        error_type: escrowError.type,
        error_message: escrowError.message,
        status_code: String(escrowError.statusCode),
        cost: cost !== undefined ? String(cost) : "undefined",
        direct_debit_attempted:
          cost !== undefined && cost > 0 ? "true" : "false",
      },
      true
    );
    tracer.finishTrace();
    this.ctx.waitUntil(tracer.sendTrace());
  }

  private traceStaleEscrowCleanup(
    organizationId: string,
    staleEscrowsCleared: number
  ): void {
    const tracer = createDataDogTracer(this.env);
    tracer.startTrace(
      "ptb.stale_escrows_cleared",
      "escrow_cleanup",
      {
        org_id: organizationId,
        escrows_cleared: String(staleEscrowsCleared),
      },
      true
    );
    tracer.finishTrace();
    this.ctx.waitUntil(tracer.sendTrace());
  }

  private async syncClickhouseSpend(
    organizationId: string,
    rawAPIKey: string
  ): Promise<void> {
    return;
  }
}
