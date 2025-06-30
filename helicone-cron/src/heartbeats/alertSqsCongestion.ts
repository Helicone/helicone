import { Env } from "..";
import { AlertManager } from "../managers/AlertManager";
import { callJawn } from "../util/helpers";
import { SqsClient } from "../client/SqsClient";

const ALERT_BANNER_ID_DELAY_IN_QUEUE = 7;

export async function alertSqsCongestion(env: Env, alertManager: AlertManager) {
  const sqsClient = new SqsClient(env);
  const queueSize = await sqsClient.getQueueSize();
  const queueSizeLowPriority = await sqsClient.getQueueSizeLowPriority();

  console.log("Queue size: ", queueSize);

  // If we can't determine queue size, don't change alert state
  if (queueSize === null || queueSizeLowPriority === null) {
    console.error("Failed to determine SQS queue size");
    return;
  }

  if (queueSize >= 100000 || queueSizeLowPriority >= 100000) {
    const alertBanners = await callJawn<
      null,
      {
        data: {
          updated_at: string;
          title: string;
          message: string;
          id: string;
          created_at: string;
          active: boolean;
        }[];
      }
    >("/v1/public/alert-banner", "GET", null, env);

    const banner = alertBanners?.data?.find(
      (banner) => banner.id === String(ALERT_BANNER_ID_DELAY_IN_QUEUE)
    );

    // If the banner is not active, we need to activate it
    if (banner && banner.active == false) {
      await callJawn(
        "/v1/public/alert-banner",
        "PATCH",
        {
          id: ALERT_BANNER_ID_DELAY_IN_QUEUE,
          active: true,
        },
        env
      );

      await alertManager.sendSlackMessageToChannel(
        env.SLACK_ALERT_CHANNEL,
        `SQS size is too high..queue size: {${queueSize}}. Setting Alert Banner to active. Also reminder to set tasks in ECS to at least 10`
      );
    }
  } else if (queueSize >= 0 || queueSizeLowPriority >= 0) {
    const alertBanners = await callJawn<
      null,
      {
        data: {
          updated_at: string;
          title: string;
          message: string;
          id: string;
          created_at: string;
          active: boolean;
        }[];
      }
    >("/v1/public/alert-banner", "GET", null, env);

    const banner = alertBanners?.data?.find(
      (banner) => banner.id === String(ALERT_BANNER_ID_DELAY_IN_QUEUE)
    );

    if (banner && banner.active == true) {
      await callJawn(
        "/v1/public/alert-banner",
        "PATCH",
        {
          id: ALERT_BANNER_ID_DELAY_IN_QUEUE,
          active: false,
        },
        env
      );

      await alertManager.sendSlackMessageToChannel(
        env.SLACK_ALERT_CHANNEL,
        `SQS size is stabilized: ${queueSize}. Setting Alert Banner to inactive. Also reminder to set tasks in ECS back to 5`
      );
    }
  }
}
