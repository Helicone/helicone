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
      console.error(
        "Too many redirects detected. Stopping to prevent infinite loop."
      );
      return;
    }

    if (
      unauthorized === "true" &&
      heliconeAuthClient &&
      heliconeAuthClient.user?.id
    ) {
      if (!refreshed) {
        // FIX: Clear the unauthorized parameter when redirecting to prevent infinite loop
        const { unauthorized: _, ...cleanQuery } = router.query;
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
        // If already refreshed, redirect to dashboard
        const { unauthorized: _, ...cleanQuery } = router.query;
        router.push({
          pathname: "/dashboard",
          query: cleanQuery,
        });
      }
      return;
    } else if (heliconeAuthClient.user?.id) {
      const { pi_session, unauthorized: _, ...restQuery } = router.query;
      router.push({
        pathname: pi_session ? "/pi/onboarding" : "/dashboard",
        query: restQuery, // FIX: Don't include unauthorized in the query
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
          <div className="flex items-center justify-center h-screen flex-col">
            <LoadingAnimation />
            <h1 className="text-4xl font-semibold">Getting your dashboard</h1>
          </div>
        ) : (
          <AuthForm
            handleEmailSubmit={async (email: string, password: string) => {
              const { data, error } =
                await heliconeAuthClient.signInWithPassword({
                  email: email,
                  password: password,
                });

              if (error) {
                setNotification("Error logging in. Please try again.", "error");
                console.error(error);
                return;
              }
              setNotification("Success. Redirecting...", "success");
              router.push("/dashboard");
            }}
            handleGoogleSubmit={async () => {
              const { error } = await heliconeAuthClient.signInWithOAuth({
                provider: "google",
              });
              if (error) {
                setNotification("Error logging in. Please try again.", "error");
                console.error(error);
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
                console.error(error);
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
  context: GetServerSidePropsContext
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

  // default to the https://us.helicone.ai/signin if no other conditions are met
  return {
    redirect: {
      destination: "https://us.helicone.ai/signin",
      permanent: true,
    },
  };
};

export default SignIn;
