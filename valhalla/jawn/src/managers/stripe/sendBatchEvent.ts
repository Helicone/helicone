import Stripe from "stripe";
import { subdivide } from "../../utils/subdivide";

type StripeMeterEvent = Stripe.V2.Billing.MeterEventStreamCreateParams.Event;
const MAX_BATCH_SIZE = 100;

export async function sendMeteredBatch(
  events: StripeMeterEvent[],
  authToken: string
) {
  for (const miniBatch of subdivide(events, MAX_BATCH_SIZE - 1)) {
    const response = await fetch(
      "https://meter-events.stripe.com/v2/billing/meter_event_stream",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
          "Stripe-Version": "2025-03-31.preview",
        },
        body: JSON.stringify({ events: miniBatch }),
      }
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Error response from Stripe: ${response.status} ${errorText}`
      );
    }
  }
}
