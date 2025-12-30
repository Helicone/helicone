import Stripe from "stripe";
import { StripeManager } from "../../managers/stripe/StripeManager";
import {
  PromiseGenericResult,
  Result,
  err,
  ok,
} from "../../packages/common/result";
import { KVCache } from "../cache/kvCache";
import { dbExecute } from "../shared/db/dbExecute";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext } from "./HandlerContext";
import { cacheResultCustom } from "../../utils/cacheResult";

const DEFAULT_CACHE_REFERENCE_ID = "00000000-0000-0000-0000-000000000000";
type StripeMeterEvent = Stripe.V2.Billing.MeterEventStreamCreateParams.Event;

const cache = new KVCache(60 * 1000); // 1 hour

const getStripeCustomerId = async (
  organizationId: string
): Promise<Result<string, string>> => {
  const result = await dbExecute<{ stripe_customer_id: string }>(
    `SELECT stripe_customer_id FROM organization where id = $1 limit 1`,
    [organizationId]
  );

  if (result.error) {
    return err(`Error fetching stripe customer id: ${result.error}`);
  }

  if (!result.data?.[0]?.stripe_customer_id) {
    return err("Stripe customer id not found");
  }

  return ok(result.data[0].stripe_customer_id);
};

export class StripeLogHandler extends AbstractLogHandler {
  private stripeTraceUsages: StripeMeterEvent[] = [];
  constructor() {
    super();
  }

  public async handle(context: HandlerContext): PromiseGenericResult<string> {
    const start = performance.now();
    context.timingMetrics.push({
      constructor: this.constructor.name,
      start,
    });
    const organizationId = context.authParams?.organizationId;
    if (!organizationId) {
      return await super.handle(context);
    }

    if (
      context.message.log.request.cacheReferenceId &&
      context.message.log.request.cacheReferenceId !==
        DEFAULT_CACHE_REFERENCE_ID
    ) {
      return await super.handle(context);
    }

    const stripe_customer_id = await cacheResultCustom(
      "stripe_customer_id_" + organizationId,
      async () => getStripeCustomerId(organizationId),
      cache
    );

    if (stripe_customer_id.error || !stripe_customer_id.data) {
      return await super.handle(context);
    }

    const request_event: StripeMeterEvent = {
      identifier: `org_${organizationId}_request_${context.message.log.request.id}`,
      event_name: "requests_sum",
      timestamp: context.message.log.request.requestCreatedAt.toISOString(),
      payload: {
        stripe_customer_id: stripe_customer_id.data,
        value: "1",
      },
    };
    this.stripeTraceUsages.push(request_event);

    const byte_event: StripeMeterEvent = {
      identifier: `org_${organizationId}_byte_${context.message.log.request.id}`,
      event_name: "bytes_sum",
      timestamp: context.message.log.request.requestCreatedAt.toISOString(),
      payload: {
        stripe_customer_id: stripe_customer_id.data,
        value: context.sizeBytes?.toString() ?? "0",
      },
    };

    this.stripeTraceUsages.push(byte_event);

    return await super.handle(context);
  }

  public async handleResults(): PromiseGenericResult<string> {
    const stripeManager = new StripeManager({
      organizationId: "",
    });

    const result = await stripeManager.trackStripeMeter(this.stripeTraceUsages);

    if (result.error) {
      return err(`Error tracking stripe meter: ${result.error}`);
    }

    return ok("Successfully handled segment logs");
  }
}
