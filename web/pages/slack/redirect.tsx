import AuthLayout from "@/components/layout/auth/authLayout";
import { Button } from "@/components/ui/button";
import { dbExecute } from "@/lib/api/db/dbExecute";
import {
  SLACK_OAUTH_NONCE_COOKIE,
  clearSlackNonceCookie,
  getSlackRedirectUri,
  isHttpsRequest,
  verifySlackOAuthState,
} from "@/lib/slack/oauthState";
import { logger } from "@/lib/telemetry/logger";
import { getSSRHeliconeAuthClient } from "@/packages/common/auth/client/getSSRHeliconeAuthClient";
import { GetServerSidePropsContext } from "next";
import Link from "next/link";
import { ReactElement } from "react";

export default function SlackRedirect({ error }: { error?: string }) {
  return (
    <div>
      {error ? <div>{error}</div> : <div>Slack Redirect</div>}
      <div>
        <Button asChild>
          <Link href="/alerts">Go to Alerts</Link>
        </Button>
      </div>
    </div>
  );
}

SlackRedirect.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

const INVALID_STATE_ERROR =
  "This Slack connection link is invalid or has expired. Please start again from Helicone.";

async function isOrgMember(userId: string, orgId: string): Promise<boolean> {
  const { data, error } = await dbExecute<{ id: string }>(
    `
    SELECT organization.id FROM organization
    LEFT JOIN organization_member
      ON organization_member.organization = organization.id
      AND organization_member.member = $2
    WHERE organization.id = $1
      AND organization.soft_delete = false
      AND (organization_member.member = $2 OR organization.owner = $2)
    LIMIT 1
    `,
    [orgId, userId],
  );
  if (error) {
    logger.error({ error, orgId }, "Slack OAuth: org membership check failed");
    return false;
  }
  return (data?.length ?? 0) > 0;
}

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const { code, state } = context.query;
  const isHttps = isHttpsRequest(context.req);
  const cookieNonce = context.req.cookies?.[SLACK_OAUTH_NONCE_COOKIE];

  // The nonce cookie is single-use: clear it on every callback, whatever the
  // outcome, so a state value can never be replayed from this browser.
  context.res.setHeader("Set-Cookie", clearSlackNonceCookie(isHttps));

  if (typeof code !== "string" || typeof state !== "string" || !code) {
    return {
      props: {
        error: "Missing code or state",
      },
    };
  }

  // 1. Must be signed in.
  const authClient = await getSSRHeliconeAuthClient({ ctx: context });
  const user = await authClient.getUser();
  if (user.error || !user.data?.id) {
    return {
      redirect: {
        destination: "/signin?unauthorized=true",
        permanent: false,
      },
    };
  }

  // 2. State must be authentic, unexpired, started by this browser, and bound
  //    to the signed-in user.
  const verified = verifySlackOAuthState(state, cookieNonce);
  if (!verified || verified.userId !== user.data.id) {
    logger.warn(
      { userId: user.data.id, hasCookieNonce: !!cookieNonce },
      "Slack OAuth: rejected invalid state",
    );
    return {
      props: {
        error: INVALID_STATE_ERROR,
      },
    };
  }

  // 3. The user must (still) belong to the org the state was issued for.
  if (!(await isOrgMember(user.data.id, verified.orgId))) {
    return {
      props: {
        error: "You do not have access to this organization.",
      },
    };
  }

  let responseData: Record<string, any> = {};
  const slackRedirectUrl = getSlackRedirectUri(
    context.req.headers.host,
    isHttps,
  );

  try {
    const response = await fetch(`https://slack.com/api/oauth.v2.access`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_SLACK_CLIENT_ID ?? "",
        client_secret: process.env.SLACK_CLIENT_SECRET ?? "",
        code,
        redirect_uri: slackRedirectUrl ?? "",
      }),
    });
    const data = await response.json();

    if (data.ok) {
      responseData = data;
    } else {
      // Log only Slack's error code, never the response body.
      logger.error(
        {
          slackError: data?.error,
        },
        "Failed to get access token",
      );
      return {
        props: {
          error: "Failed to get access token",
        },
      };
    }
  } catch (error) {
    logger.error(
      {
        error,
      },
      "Failed to get access token",
    );
    return {
      props: {
        error: "Failed to get access token",
      },
    };
  }

  const { error: slackError } = await dbExecute<{
    id: string;
  }>(
    `
    INSERT INTO integrations (integration_name, organization_id, settings)
    VALUES ($1, $2, $3)
    RETURNING id
    `,
    [
      "slack",
      verified.orgId,
      {
        team_id: responseData.team?.id,
        access_token: responseData.access_token,
      },
    ],
  );

  if (slackError) {
    // Never surface raw DB errors to the browser.
    logger.error(
      { error: slackError, orgId: verified.orgId },
      "Failed to save Slack integration",
    );
    return {
      props: {
        error: "Failed to save the Slack integration. Please try again.",
      },
    };
  }

  return {
    redirect: {
      destination: "/dashboard",
      permanent: false,
    },
  };
};
