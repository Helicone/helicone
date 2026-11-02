import { Body, Controller, Post, Request, Route, Security, Tags } from "tsoa";
import { type JawnAuthenticatedRequest } from "../../types/request";
import { type KafkaMessageContents } from "../../lib/handlers/HandlerContext";
import { LogManager } from "../../managers/LogManager";
import { matchesManualAccessKey } from "../../utils/manualAccessKey";
import { validateExternalUrl } from "../../utils/ssrfGuard";

/**
 * Validates the customer-supplied integration hosts on a log message. They
 * are called server-side, so they must not point at internal addresses.
 */
export async function validateLogMessageHosts(
  heliconeMeta: KafkaMessageContents["heliconeMeta"]
): Promise<string | null> {
  for (const host of [heliconeMeta?.lytixHost, heliconeMeta?.posthogHost]) {
    if (host === undefined || host === null || host === "") {
      continue;
    }
    const valid = await validateExternalUrl(host);
    if (valid.error !== null) {
      return valid.error;
    }
  }
  return null;
}

@Route("v1/log")
@Tags("Log")
@Security("api_key")
export class LogController extends Controller {
  /**
   * Internal HTTP fallback used by the Helicone worker. Requires the
   * server-held manual access key in heliconeMeta.
   *
   * @param logMessage Log message to log
   */
  @Post("/request")
  public async logRequests(
    @Body()
    logMessage: KafkaMessageContents,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<void> {
    // Mandatory, constant-time, and fails closed when the server has no key
    // configured.
    if (
      !matchesManualAccessKey(logMessage?.heliconeMeta?.heliconeManualAccessKey)
    ) {
      this.setStatus(401);
      return;
    }

    const hostError = await validateLogMessageHosts(logMessage.heliconeMeta);
    if (hostError) {
      this.setStatus(400);
      return;
    }

    const logManager = new LogManager();
    try {
      await logManager.processLogEntry(logMessage);
      this.setStatus(200);
    } catch (error: any) {
      console.error(`Error processing log entry: ${error.message}`);
      this.setStatus(500);
    }
    return;
  }
}
