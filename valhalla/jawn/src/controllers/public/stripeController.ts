import {
  Controller,
  Route,
  Tags,
  Security,
  Post,
  Body,
  Request,
  Get,
} from "tsoa";
import Stripe from "stripe";
import { JawnAuthenticatedRequest } from "../../types/request";
import { StripeManager } from "../../managers/stripe/StripeManager";

@Route("v1/stripe")
@Tags("Stripe")
@Security("api_key")
export class StripeController extends Controller {
  @Get("/subscription/upgrade-to-pro")
  public async upgradeToPro(@Request() request: JawnAuthenticatedRequest) {
    const stripeManager = new StripeManager(request.authParams);
    const result = await stripeManager.upgradeToProLink();

    if (result.error) {
      this.setStatus(400);
      throw new Error(result.error);
    }

    return result.data;
  }

  @Get("/subscription")
  public async getSubscription(@Request() request: JawnAuthenticatedRequest) {
    const stripeManager = new StripeManager(request.authParams);
    const result = await stripeManager.getSubscription();

    if (result.error) {
      this.setStatus(400);
      throw new Error(result.error);
    }

    return result.data;
  }

  @Post("/webhook")
  public async handleStripeWebhook(
    @Body() body: any,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<void> {
    const stripeManager = new StripeManager(request.authParams);
    const signature = request.headers["stripe-signature"] as string;

    const result = await stripeManager.handleStripeWebhook(body, signature);

    if (result.error) {
      console.error("Error processing webhook:", result.error);
      this.setStatus(400);
    } else {
      this.setStatus(200);
    }
  }
}
