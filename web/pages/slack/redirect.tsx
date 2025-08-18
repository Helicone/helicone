import AuthLayout from "@/components/layout/auth/authLayout";
import { Button } from "@/components/ui/button";
import { dbExecute } from "@/lib/api/db/dbExecute";
import { logger } from "@/lib/telemetry/logger";
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

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const { code, state } = context.query;
  const host = context.req.headers.host;

  if (!code || !state) {
    return {
      props: {
        error: "Missing code or state",
      },
    };
  }

  const { data, error } = await dbExecute<{ id: string }>(
    `
    SELECT id FROM organization
    WHERE id = $1
    `,
    [state],
  );

  if (error) {
    return {
      props: {
        error: error,
      },
    };
  }

  const organization = data?.[0];

  if (!organization) {
    return {
      props: {
        error: "Organization not found",
      },
    };
  }

  let responseData: Record<string, any> = {};

  const environment = process.env.VERCEL_ENV ?? "development";
  const slackRedirectUrl = host
    ? environment === "development"
      ? `https://redirectmeto.com/http://${host}/slack/redirect`
      : `https://${host}/slack/redirect`
    : null;

  try {
    const response = await fetch(`https://slack.com/api/oauth.v2.access`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_SLACK_CLIENT_ID ?? "",
        client_secret: process.env.SLACK_CLIENT_SECRET ?? "",
        code: code as string,
        redirect_uri: slackRedirectUrl ?? "",
      }),
    });
    const data = await response.json();

    if (data.ok) {
      responseData = data;
    } else {
      logger.error(
        {
          data,
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
    RETURNING *
    `,
    [
      "slack",
      organization.id,
      {
        team_id: responseData.team.id,
        access_token: responseData.access_token,
      },
    ],
  );

  if (slackError) {
    return {
      props: {
        error: slackError,
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
