import retry from "async-retry";
import { DisallowListKVSync } from "../ai-gateway/DisallowListKVSync";
import { WalletKVSync } from "../ai-gateway/WalletKVSync";
import { SYNC_STALENESS_THRESHOLD, Wallet } from "../durable-objects/Wallet";
import { HeliconeProxyRequest } from "../models/HeliconeProxyRequest";
import { createDataDogTracer } from "../monitoring/DataDogTracer";
import { err, ok, Result } from "../util/results";

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
      // Await the pending escrow to get the escrowId
      const escrowResult = await proxyRequest.escrowInfo.escrow;

      if (escrowResult.error) {
        console.error("Escrow reservation failed", escrowResult.error);

        // Send a dedicated trace for optimistic escrow failure with full metadata
        // This happens when we proceeded with LLM request based on cached balance
        // but the actual escrow reservation failed (e.g., insufficient funds)
        // TODO: Refactor to pass tracer/traceContext through so this can be a span on the main trace
        const tracer = createDataDogTracer(this.env);
        tracer.startTrace(
          "ptb.optimistic_escrow_failure",
          "escrow_failure",
          {
            org_id: organizationId,
            provider: proxyRequest.escrowInfo.endpoint.provider,
            model: proxyRequest.escrowInfo.endpoint.providerModelId,
            error_type: escrowResult.error.type,
            error_message: escrowResult.error.message,
            status_code: String(escrowResult.error.statusCode),
          },
          true // forceSample - always trace escrow failures
        );
        tracer.finishTrace();
        this.ctx.waitUntil(tracer.sendTrace());

        return err(escrowResult.error.message);
      }
      const escrowId = escrowResult.data.reservedEscrowId;

      const { clickhouseLastCheckedAt, remainingBalance, staleEscrowsCleared } =
        await retry(
          async (bail) => {
            try {
              return await this.walletStub.finalizeEscrow(
                organizationId,
                escrowId,
                cost ?? 0
              );
            } catch (e) {
              // Don't retry validation errors
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
            retries: 3,
            minTimeout: 100,
            maxTimeout: 1000,
            onRetry: (error, attempt) => {
              console.warn(
                `Retry attempt ${attempt} for finalizeEscrow. Error: ${error}`
              );
            },
          }
        );

      // Store remaining balance to KV for future optimistic checks
      const walletKVSync = new WalletKVSync(this.env.WALLET_KV, organizationId);
      await walletKVSync.storeWalletState(remainingBalance);

      // Log stale escrow cleanup to DataDog
      if (staleEscrowsCleared !== undefined && staleEscrowsCleared > 0) {
        const tracer = createDataDogTracer(this.env);
        tracer.startTrace(
          "ptb.stale_escrows_cleared",
          "escrow_cleanup",
          {
            org_id: organizationId,
            escrows_cleared: String(staleEscrowsCleared),
          },
          true // forceSample - always log cleanup events
        );
        tracer.finishTrace();
        this.ctx.waitUntil(tracer.sendTrace());
      }

      if (
        cost === undefined &&
        statusCode >= 200 &&
        statusCode < 300 &&
        // anthropic, and other providers, may return a 200 status code for streams
        // even when an error occurs in the middle of the event stream. Therefore,
        // we cannot use those events to add the (provider, model) to the disallow list.
        !proxyRequest.isStream
      ) {
        // if the cost is 0, we need to add the request to the disallow list
        // so that we guard against abuse
        await this.walletStub.addToDisallowList(
          proxyRequest.requestId,
          proxyRequest.escrowInfo.endpoint.provider,
          proxyRequest.requestWrapper.getGatewayAttempt()?.endpoint
            .providerModelId ?? "*"
        );

        // Invalidate KV cache so next request fetches fresh data
        const disallowKVSync = new DisallowListKVSync(
          this.env.WALLET_KV,
          organizationId
        );
        await disallowKVSync.invalidate();
      }

      const timeSinceLastCheck = Date.now() - clickhouseLastCheckedAt;
      if (timeSinceLastCheck > SYNC_STALENESS_THRESHOLD) {
        await this.syncClickhouseSpend(
          organizationId,
          proxyRequest.requestWrapper.getRawProviderAuthHeader() ?? ""
        );
      }
      return ok({ remainingBalance });
    } catch (error) {
      console.error("Error finalizing escrow:", error);
      return err(`Error finalizing escrow: ${error}`);
    }
  }

  private async syncClickhouseSpend(
    organizationId: string,
    rawAPIKey: string
  ): Promise<void> {
    return;
    // try {
    //   // get the totaldebit spent according to clickhouse
    //   const response = await fetch(
    //     `${this.env.VALHALLA_URL}/v1/credits/totalSpend`,
    //     {
    //       method: "GET",
    //       headers: {
    //         "Content-Type": "application/json",
    //         Authorization: `Bearer ${rawAPIKey}`,
    //       },
    //     }
    //   );
    //   const clickhouseResponse: Result<{ totalSpend: number }, string> =
    //     await response.json();
    //   if (isError(clickhouseResponse)) {
    //     console.error("Error getting total spend", clickhouseResponse.error);
    //     throw new Error(clickhouseResponse.error);
    //   }
    //   const clickhouseTotalSpend = clickhouseResponse.data;
    //   const { totalDebits: walletTotalSpend, alertState } =
    //     await this.walletStub.getTotalDebits(organizationId);
    //   const delta = Math.abs(
    //     clickhouseTotalSpend.totalSpend - walletTotalSpend
    //   );

    //   // Update the ClickHouse values in the wallet
    //   await this.walletStub.updateClickhouseValues(
    //     organizationId,
    //     clickhouseTotalSpend.totalSpend
    //   );

    //   // if alert state is on, and the delta is less than the threshold, reset the state
    //   if (alertState && delta < ALERT_THRESHOLD) {
    //     await this.walletStub.setAlertState(ALERT_ID, false);
    //   } else if (!alertState && delta > ALERT_THRESHOLD) {
    //     // set the alert state to on
    //     await this.walletStub.setAlertState(ALERT_ID, true);
    //     const slackAlertManager = new SlackAlertManager(this.env);
    //     await slackAlertManager.sendSlackMessageToChannel(
    //       this.env.SLACK_ALERT_CHANNEL,
    //       `Total spend delta is greater than ${ALERT_THRESHOLD} USD. Current total spend: ${clickhouseTotalSpend.totalSpend} USD. Wallet total spend: ${walletTotalSpend} USD. Delta: ${delta} USD. Org ID: ${organizationId}`
    //     );
    //   }
    // } catch (error) {
    //   console.error("Error getting total spend", error);
    // }
  }
}
