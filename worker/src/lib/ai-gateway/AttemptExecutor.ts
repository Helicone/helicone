import { 
  buildRequestBody, 
  authenticateRequest as authenticateProviderRequest 
} from "@helicone-package/cost/models/provider-helpers";
import { RequestWrapper } from "../RequestWrapper";
import { toAnthropic } from "../clients/llmmapper/providers/openai/request/toAnthropic";
import { isErr, Result, ok, err } from "../util/results";
import { Attempt, EscrowReservation, EscrowInfo } from "./types";

export class AttemptExecutor {
  constructor(
    private readonly env: Env,
    private readonly ctx: ExecutionContext
  ) {}

  async execute(
    attempt: Attempt,
    requestWrapper: RequestWrapper,
    parsedBody: any,
    orgId: string,
    forwarder: (targetBaseUrl: string | null, escrowInfo?: EscrowInfo) => Promise<Response>
  ): Promise<Response> {
    const { endpoint, providerKey, needsEscrow, source } = attempt;
    
    let escrowReservation: EscrowReservation | undefined;

    // Reserve escrow if needed (PTB only)
    if (needsEscrow && endpoint.ptbEnabled) {
      const escrowResult = await this.reserveEscrow(
        attempt,
        requestWrapper.heliconeHeaders.requestId,
        orgId
      );
      
      if (isErr(escrowResult)) {
        throw new Error(`[${source}] Escrow failed: ${escrowResult.error}`);
      }
      
      escrowReservation = escrowResult.data;
    }

    try {
      // Build request body using provider helpers
      const bodyResult = await buildRequestBody(endpoint, {
        parsedBody,
        bodyMapping: requestWrapper.heliconeHeaders.gatewayConfig.bodyMapping,
        toAnthropic: toAnthropic
      });

      if (isErr(bodyResult) || !bodyResult.data) {
        throw new Error(`[${source}] Failed to build request body: ${bodyResult.error || "Unknown error"}`);
      }

      // Set up authentication headers using provider helpers
      const authResult = await authenticateProviderRequest(endpoint, {
        config: (providerKey.config as any) || {},
        apiKey: providerKey.decrypted_provider_key,
        secretKey: providerKey.decrypted_provider_secret_key || undefined,
        bodyMapping: requestWrapper.heliconeHeaders.gatewayConfig.bodyMapping,
        requestMethod: requestWrapper.getMethod(),
        requestUrl: endpoint.baseUrl,
        requestBody: bodyResult.data
      });

      if (authResult.error) {
        throw new Error(`[${source}] Authentication failed: ${authResult.error}`);
      }

      // Apply headers and body to request wrapper
      requestWrapper.setHeader("Helicone-Auth", requestWrapper.getAuthorization() ?? "");
      requestWrapper.resetObject();
      requestWrapper.setUrl(endpoint.baseUrl);
      requestWrapper.setBody(bodyResult.data);

      // Apply auth headers from provider
      for (const [key, value] of Object.entries(authResult.data?.headers || {})) {
        requestWrapper.setHeader(key, value);
      }

      // Forward the request
      const escrowInfo = escrowReservation ? {
        escrowId: escrowReservation.escrowId,
        endpoint: escrowReservation.endpoint,
        model: endpoint.providerModelId
      } : undefined;

      const response = await forwarder(endpoint.baseUrl, escrowInfo);

      if (!response.ok) {
        throw new Error(`[${source}] Request failed with status ${response.status}`);
      }

      console.log(`[${source}] Success`);
      return response;

    } catch (error) {
      // Cancel escrow on failure
      if (escrowReservation) {
        this.ctx.waitUntil(
          this.cancelEscrow(escrowReservation.escrowId, orgId)
        );
      }
      throw error;
    }
  }

  private async reserveEscrow(
    attempt: Attempt,
    requestId: string,
    orgId: string
  ): Promise<Result<EscrowReservation, string>> {
    const { endpoint } = attempt;
    
    // Calculate max cost using first pricing tier
    const firstTierPricing = endpoint.pricing?.[0];
    if (!firstTierPricing || 
        !endpoint.contextLength || 
        !endpoint.maxCompletionTokens ||
        firstTierPricing.input === 0 ||
        firstTierPricing.output === 0) {
      return err(`Cost not supported for ${endpoint.provider}/${endpoint.providerModelId}`);
    }

    const maxPromptCost = endpoint.contextLength * firstTierPricing.input;
    const maxCompletionCost = endpoint.maxCompletionTokens * firstTierPricing.output;
    const worstCaseCost = maxPromptCost + maxCompletionCost;

    if (worstCaseCost <= 0) {
      return err(`Invalid cost calculation for ${endpoint.provider}/${endpoint.providerModelId}`);
    }

    try {
      const walletId = this.env.WALLET.idFromName(orgId);
      const walletStub = this.env.WALLET.get(walletId);
      
      const escrowResult = await walletStub.reserveCostInEscrow(
        orgId,
        requestId,
        worstCaseCost
      );

      if (isErr(escrowResult)) {
        return err(escrowResult.error.message);
      }

      return ok({
        escrowId: escrowResult.data.escrowId,
        endpoint,
        amount: worstCaseCost
      });
    } catch (error) {
      return err(error instanceof Error ? error.message : "Unknown escrow error");
    }
  }

  private async cancelEscrow(escrowId: string, orgId: string): Promise<void> {
    try {
      const walletId = this.env.WALLET.idFromName(orgId);
      const walletStub = this.env.WALLET.get(walletId);
      await walletStub.cancelEscrow(escrowId);
    } catch (error) {
      console.error(`Failed to cancel escrow ${escrowId}:`, error);
    }
  }
}