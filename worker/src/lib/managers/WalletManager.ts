import {
  ALERT_ID,
  ALERT_THRESHOLD,
  SYNC_STALENESS_THRESHOLD,
  Wallet,
} from "../durable-objects/Wallet";
import { SlackAlertManager } from "./SlackAlertManager";
import { err, ok, Result } from "../util/results";
import { isError } from "../../../../packages/common/result";
import { HeliconeProxyRequest } from "../models/HeliconeProxyRequest";

export class WalletManager {
  private env: Env;
  private walletStub: DurableObjectStub<Wallet>;
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
    cost: number,
    cachedResponse?: Response
  ): Promise<Result<void, string>> {
    if (!proxyRequest.escrowInfo) {
      return err("No escrow info");
    }

    try {
      const { clickhouseLastCheckedAt } = await this.walletStub.finalizeEscrow(
        organizationId,
        proxyRequest.escrowInfo.escrowId,
        cost
      );

      if (
        cost === 0 &&
        (cachedResponse === undefined || cachedResponse === null)
      ) {
        // if the cost is 0 and we're not using a cached response, we need to add the request to the disallow list
        // so that we guard against abuse
        await this.walletStub.addToDisallowList(
          proxyRequest.requestId,
          proxyRequest.provider,
          proxyRequest.escrowInfo.model ?? "*"
        );
      }

      if (clickhouseLastCheckedAt > SYNC_STALENESS_THRESHOLD) {
        await this.syncClickhouseSpend(
          organizationId,
          proxyRequest.requestWrapper.getRawProviderAuthHeader() ?? ""
        );
      }
      return ok(undefined);
    } catch (error) {
      console.error(
        `Error finalizing escrow ${proxyRequest.escrowInfo.escrowId}:`,
        error
      );
      return err(`Error finalizing escrow ${proxyRequest.escrowInfo.escrowId}: ${error}`);
    }
  }

  private async syncClickhouseSpend(
    organizationId: string,
    rawAPIKey: string
  ): Promise<void> {
    try {
      // get the totaldebit spent according to clickhouse
      const response = await fetch(
        `${this.env.VALHALLA_URL}/v1/credits/totalSpend`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${rawAPIKey}`,
          },
        }
      );
      const clickhouseResponse: Result<{ totalSpend: number }, string> =
        await response.json();
      if (isError(clickhouseResponse)) {
        console.error("Error getting total spend", clickhouseResponse.error);
        throw new Error(clickhouseResponse.error);
      }
      const clickhouseTotalSpend = clickhouseResponse.data;
      const { totalDebits: walletTotalSpend, alertState } =
        await this.walletStub.getTotalDebits(organizationId);
      const delta = Math.abs(
        clickhouseTotalSpend.totalSpend - walletTotalSpend
      );

      // Update the ClickHouse values in the wallet
      await this.walletStub.updateClickhouseValues(
        organizationId,
        clickhouseTotalSpend.totalSpend
      );

      // if alert state is on, and the delta is less than the threshold, reset the state
      if (alertState && delta < ALERT_THRESHOLD) {
        await this.walletStub.setAlertState(ALERT_ID, false);
      } else if (!alertState && delta > ALERT_THRESHOLD) {
        // set the alert state to on
        await this.walletStub.setAlertState(ALERT_ID, true);
        const slackAlertManager = new SlackAlertManager(this.env);
        await slackAlertManager.sendSlackMessageToChannel(
          this.env.SLACK_ALERT_CHANNEL,
          `Total spend delta is greater than ${ALERT_THRESHOLD} USD. Current total spend: ${clickhouseTotalSpend.totalSpend} USD. Wallet total spend: ${walletTotalSpend} USD. Delta: ${delta} USD. Org ID: ${organizationId}`
        );
      }
    } catch (error) {
      console.error("Error getting total spend", error);
    }
  }
}
