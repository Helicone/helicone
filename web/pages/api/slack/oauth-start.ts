import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import {
  SLACK_OAUTH_SCOPES,
  createSlackOAuthState,
  getSlackRedirectUri,
  isHttpsRequest,
  slackNonceCookie,
} from "../../../lib/slack/oauthState";
import { logger } from "@/lib/telemetry/logger";

/**
 * Starts the "Connect Slack" OAuth flow for the caller's current org.
 *
 * Issues a signed, expiring `state` bound to the session user + org, stores
 * its nonce in an httpOnly cookie, and redirects to Slack's authorize page.
 * /slack/redirect verifies all of it before storing the integration.
 */
async function handler({
  req,
  res,
  userData,
}: HandlerWrapperOptions<{ error: string } | void>) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const clientId = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID;
  const isHttps = isHttpsRequest(req);
  const redirectUri = getSlackRedirectUri(req.headers.host, isHttps);
  const created = createSlackOAuthState(userData.userId, userData.orgId);

  if (!clientId || !redirectUri || !created) {
    logger.error(
      {
        hasClientId: !!clientId,
        hasRedirectUri: !!redirectUri,
        hasStateSecret: !!created,
      },
      "Slack OAuth is not configured",
    );
    res.status(500).json({ error: "Slack integration is not configured" });
    return;
  }

  const authorizeUrl = new URL("https://slack.com/oauth/v2/authorize");
  authorizeUrl.searchParams.set("scope", SLACK_OAUTH_SCOPES);
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("state", created.state);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);

  res.setHeader("Set-Cookie", slackNonceCookie(created.nonce, isHttps));
  res.setHeader("Cache-Control", "no-store");
  res.redirect(302, authorizeUrl.toString());
}

export default withAuth(handler);
