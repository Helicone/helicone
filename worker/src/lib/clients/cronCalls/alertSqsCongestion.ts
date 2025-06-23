import { Env } from "../../..";
import { AlertManager } from "../../managers/AlertManager";
import { callJawn } from "../jawnClient";
import { SQSProducerImpl } from "../producers/SQSProducer";

const ALERT_BANNER_ID_DELAY_IN_QUEUE = 7;
const FIRE_ALERT_CHANNEL = "C092GFJQP43";

export async function alertSqsCongestion(env: Env, alertManager: AlertManager) {
  const sqsProducer = new SQSProducerImpl(env);
  // Check SQS queue size
  const queueSize = await sqsProducer.getQueueSize();
  if (queueSize > 100000) {
    // Set logs to lower priority
    await callJawn(
      "/v1/admin/alert_banners",
      "POST",
      {
        id: ALERT_BANNER_ID_DELAY_IN_QUEUE,
        active: true,
      },
      env
    );

    await alertManager.sendSlackMessageToChannel(
      FIRE_ALERT_CHANNEL,
      `SQS size is too high: ${queueSize}. Setting Alert Banner to active`
    );
  } else if (queueSize < 10) {
    const alertBanners = await callJawn<
      object,
      {
        updated_at: string;
        title: string;
        message: string;
        id: number;
        created_at: string;
        active: boolean;
      }[]
    >("/v1/alert-banner", "GET", {}, env);

    const banner = alertBanners?.find(
      (banner) => banner.id === ALERT_BANNER_ID_DELAY_IN_QUEUE
    );

    if (banner && banner.active == false) {
      await callJawn(
        "/v1/admin/alert_banners",
        "POST",
        {
          id: ALERT_BANNER_ID_DELAY_IN_QUEUE,
          active: false,
        },
        env
      );

      await alertManager.sendSlackMessageToChannel(
        FIRE_ALERT_CHANNEL,
        `SQS size is stabilized: ${queueSize}. Setting Alert Banner to inactive`
      );
    }
  }
}
