import LoadingAnimation from "@/components/shared/loadingAnimation";
import { useHeliconeAuthClient } from "@/packages/common/auth/client/AuthClientFactory";
import { GetServerSidePropsContext } from "next";
import { env } from "next-runtime-env";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import PublicMetaData from "../components/layout/public/publicMetaData";
import useNotification from "../components/shared/notification/useNotification";
import AuthForm from "../components/templates/auth/authForm";
import { Result } from "@/packages/common/result";
import { logger } from "@/lib/telemetry/logger";

const SignIn = ({
  customerPortal,
}: {
  customerPortal?: Result<
    {
      domain: string;
      logo: string;
    },
    string
  >;
}) => {
  const heliconeAuthClient = useHeliconeAuthClient();
  const router = useRouter();
  const { setNotification } = useNotification();

  const customerPortalContent = customerPortal?.data || undefined;
  const { unauthorized } = router.query;
  const [refreshed, setRefreshed] = useState(false);
  const [redirectCount, setRedirectCount] = useState(0);

  useEffect(() => {
    // Prevent infinite loops by limiting redirects
    if (redirectCount >= 3) {
      logger.error(
        {
          redirectCount,
          unauthorized,
          userId: heliconeAuthClient?.user?.id,
        },
        "Too many redirects detected. Stopping to prevent infinite loop.",
      );
      return;
    }

    // Get the returnTo parameter for redirecting after sign in
    const returnTo = router.query.returnTo as string | undefined;

    // Determine the destination after sign in
    const getRedirectDestination = () => {
      const { pi_session } = router.query;
      if (pi_session) return "/pi/onboarding";
      if (returnTo && returnTo.startsWith("/")) return returnTo;
      return "/dashboard";
    };

    if (
      unauthorized === "true" &&
      heliconeAuthClient &&
      heliconeAuthClient.user?.id
    ) {
      if (!refreshed) {
        // FIX: Clear the unauthorized parameter when redirecting to prevent infinite loop
        const { unauthorized: _, returnTo: __, ...cleanQuery } = router.query;
        router
          .push({
            pathname: "/signin",
            query: cleanQuery,
          })
          .then(() => {
            heliconeAuthClient.refreshSession();
            setRefreshed(true);
            setRedirectCount((prev) => prev + 1);
          });
      } else {
        // If already refreshed, redirect to intended destination or dashboard
        const { unauthorized: _, returnTo: __, ...cleanQuery } = router.query;
        router.push({
          pathname: getRedirectDestination(),
          query: cleanQuery,
        });
      }
      return;
    } else if (heliconeAuthClient.user?.id) {
      const { pi_session, unauthorized: _, returnTo: __, ...restQuery } = router.query;
      router.push({
        pathname: getRedirectDestination(),
        query: restQuery, // FIX: Don't include unauthorized or returnTo in the query
      });
    }
  }, [
    unauthorized,
    heliconeAuthClient,
    setNotification,
    router,
    refreshed,
    redirectCount,
  ]);

  return (
    <PublicMetaData
      description={
        "How developers build AI applications. Get observability, tooling, fine-tuning, and evaluations out of the box."
      }
      ogImageUrl={"https://www.helicone.ai/static/helicone-og.webp"}
    >
      <div>
        {heliconeAuthClient.user?.id ? (
          <div className="flex h-screen flex-col items-center justify-center">
            <LoadingAnimation />
            <h1 className="text-4xl font-semibold">Getting your dashboard</h1>
          </div>
        ) : (
          <AuthForm
            handleEmailSubmit={async (email: string, password: string) => {
              const { error } = await heliconeAuthClient.signInWithPassword({
                email: email,
                password: password,
              });

              if (error) {
                setNotification(error, "error");
                logger.error(
                  {
                    error,
                    email,
                  },
                  "Email sign in failed",
                );
                return;
              }
              setNotification("Success. Redirecting...", "success");
              // Redirect to returnTo path if provided, otherwise dashboard
              const returnTo = router.query.returnTo as string | undefined;
              const destination = returnTo && returnTo.startsWith("/") ? returnTo : "/dashboard";
              router.push(destination);
            }}
            handleGoogleSubmit={async () => {
              const { error } = await heliconeAuthClient.signInWithOAuth({
                provider: "google",
              });
              if (error) {
                setNotification("Error logging in. Please try again.", "error");
                logger.error(
                  {
                    error,
                  },
                  "Google OAuth sign in failed",
                );
                return;
              }
              setNotification("Successfully signed in.", "success");
            }}
            handleGithubSubmit={async () => {
              const { error } = await heliconeAuthClient.signInWithOAuth({
                provider: "github",
              });
              if (error) {
                setNotification("Error logging in. Please try again.", "error");
                logger.error(
                  {
                    error,
                  },
                  "GitHub OAuth sign in failed",
                );
                return;
              }
              setNotification("Successfully signed in.", "success");
            }}
            authFormType={"signin"}
            customerPortalContent={customerPortalContent}
          />
        )}
      </div>
    </PublicMetaData>
  );
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  if (env("NEXT_PUBLIC_IS_ON_PREM") === "true") {
    return {
      props: {},
    };
  }

  // if the base path contains localhost or contains vercel, do nothing
  if (
    context.req.headers.host?.includes("localhost") ||
    context.req.headers.host?.includes("vercel")
  ) {
    return {
      props: {},
    };
  }

  // if the base path contains us or eu in the basepath, do nothing
  if (
    context.req.headers.host?.includes("us") ||
    context.req.headers.host?.includes("eu")
  ) {
    return {
      props: {},
    };
  }

  // default to the configured app URL signin if no other conditions are met
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://us.helicone.ai");
  return {
    redirect: {
      destination: `${appUrl}/signin`,
      permanent: true,
    },
  };
};

export default SignIn;
