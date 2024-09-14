import {
  Controller,
  Route,
  Tags,
  Security,
  Post,
  Body,
  Request,
  Get,
  Delete,
  Path,
} from "tsoa";
import Stripe from "stripe";
import { JawnAuthenticatedRequest } from "../../types/request";
import { StripeManager } from "../../managers/stripe/StripeManager";

@Route("v1/stripe")
@Tags("Stripe")
@Security("api_key")
export class StripeController extends Controller {
  @Get("/subscription/free/usage")
  public async getFreeUsage(@Request() request: JawnAuthenticatedRequest) {
    const stripeManager = new StripeManager(request.authParams);
    const result = await stripeManager.getFreeUsage();

    if (result.error) {
      this.setStatus(400);
      throw new Error(result.error);
    }

    return result.data;
  }

  @Post("/subscription/new-customer/upgrade-to-pro")
  public async upgradeToPro(@Request() request: JawnAuthenticatedRequest) {
    const stripeManager = new StripeManager(request.authParams);

    const clientOrigin = request.headers.origin;
    const result = await stripeManager.upgradeToProLink(`${clientOrigin}`);

    if (result.error) {
      this.setStatus(400);
      throw new Error(result.error);
    }

    return result.data;
  }

  @Post("/subscription/existing-customer/upgrade-to-pro")
  public async upgradeExistingCustomer(
    @Request() request: JawnAuthenticatedRequest
  ) {
    const stripeManager = new StripeManager(request.authParams);

    const result = await stripeManager.upgradeToProExistingCustomer(
      request.headers.origin ?? ""
    );

    if (result.error) {
      this.setStatus(400);
      throw new Error(result.error);
    }

    return result.data;
  }

  @Post("/subscription/manage-subscription")
  public async manageSubscription(
    @Request() request: JawnAuthenticatedRequest
  ) {
    const stripeManager = new StripeManager(request.authParams);
    const result = await stripeManager.manageSubscriptionPaymentLink(
      request.headers.origin ?? ""
    );

    if (result.error) {
      this.setStatus(400);
      throw new Error(result.error);
    }

    return result.data;
  }

  @Post("/subscription/undo-cancel-subscription")
  public async undoCancelSubscription(
    @Request() request: JawnAuthenticatedRequest
  ) {
    const stripeManager = new StripeManager(request.authParams);
    const result = await stripeManager.undoCancelSubscription();

    if (result.error) {
      this.setStatus(400);
      throw new Error(result.error);
    }

    return result.data;
  }

  @Post("/subscription/add-ons/{productType}")
  public async addOns(
    @Request() request: JawnAuthenticatedRequest,
    @Path() productType: "alerts" | "prompts"
  ) {
    const stripeManager = new StripeManager(request.authParams);
    const result = await stripeManager.addProductToSubscription(productType);

    if (result.error) {
      this.setStatus(400);
      throw new Error(result.error);
    }

    return result.data;
  }

  @Delete("/subscription/add-ons/{productType}")
  public async deleteAddOns(
    @Request() request: JawnAuthenticatedRequest,
    @Path() productType: "alerts" | "prompts"
  ) {
    const stripeManager = new StripeManager(request.authParams);
    const result = await stripeManager.deleteProductFromSubscription(
      productType
    );

    if (result.error) {
      this.setStatus(400);
      throw new Error(result.error);
    }

    return result.data;
  }

  @Get("/subscription/preview-invoice")
  public async previewInvoice(@Request() request: JawnAuthenticatedRequest) {
    const stripeManager = new StripeManager(request.authParams);
    const result = await stripeManager.getUpcomingInvoice();

    if (result.error) {
      this.setStatus(400);
      throw new Error(result.error);
    }

    return result.data;
  }

  @Post("/subscription/cancel-subscription")
  public async cancelSubscription(
    @Request() request: JawnAuthenticatedRequest
  ) {
    const stripeManager = new StripeManager(request.authParams);
    const result = await stripeManager.downgradeToFree();

    if (result.error) {
      this.setStatus(400);
      throw new Error(result.error);
    }

    return result.data;
  }

  @Post("/subscription/migrate-to-pro")
  public async migrateToPro(@Request() request: JawnAuthenticatedRequest) {
    const stripeManager = new StripeManager(request.authParams);
    const result = await stripeManager.migrateToPro();
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
