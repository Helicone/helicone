import AuthLayout from "@/components/layout/auth/authLayout";
import { Button } from "@/components/ui/button";
import { withAuthSSR } from "@/lib/api/handlerWrappers";
import { supabaseServer } from "@/lib/supabaseServer";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { ReactElement } from "react";

export default function SlackRedirect({
  user,
  error,
}: {
  user: User;
  error?: string;
}) {
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

export const getServerSideProps = withAuthSSR(async (options) => {
  const { code, state } = options.context.query;

  if (!code || !state) {
    return {
      props: {
        user: options.userData.user,
        error: "Missing code or state",
      },
    };
  }

  const { data, error } = await supabaseServer
    .from("organization")
    .select("*")
    .eq("id", state);

  if (error) {
    return {
      props: {
        user: options.userData.user,
        error: error,
      },
    };
  }

  const organization = data[0];

  if (!organization) {
    return {
      props: {
        user: options.userData.user,
        error: "Organization not found",
      },
    };
  }

  let responseData: Record<string, any> = {};

  try {
    const response = await fetch(
      `https://slack.com/api/oauth.v2.access?client_id=${process.env.NEXT_PUBLIC_SLACK_CLIENT_ID}&client_secret=${process.env.SLACK_CLIENT_SECRET}&code=${code}`
    );
    const data = await response.json();

    if (data.ok) {
      responseData = data;
    } else {
      return {
        props: {
          user: options.userData.user,
          error: "Failed to get access token",
        },
      };
    }
  } catch (error) {
    return {
      props: {
        user: options.userData.user,
        error: "Failed to get access token",
      },
    };
  }

  const { data: slackData, error: slackError } = await supabaseServer
    .from("integrations")
    .insert({
      integration_name: "slack",
      organization_id: organization.id,
      settings: {
        team_id: responseData.team.id,
        access_token: responseData.access_token,
      },
    })
    .select("*")
    .single();

  if (slackError) {
    return {
      props: {
        user: options.userData.user,
        error: slackError,
      },
    };
  }

  return {
    redirect: {
      destination: "/alerts",
      permanent: false,
    },
  };
});
