import { InboxArrowDownIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import useNotification from "../components/shared/notification/useNotification";
import ThemedModal from "../components/shared/themed/themedModal";
import AuthForm from "../components/templates/auth/authForm";
import { DEMO_EMAIL } from "../lib/constants";
import PublicMetaData from "../components/layout/public/publicMetaData";
import { GetServerSidePropsContext } from "next";
import { InfoBanner } from "../components/shared/themed/themedDemoBanner";
import { env } from "next-runtime-env";
import { useHeliconeAuthClient } from "@/packages/common/auth/client/AuthClientFactory";

const SignUp = () => {
  const heliconeAuthClient = useHeliconeAuthClient();
  const { setNotification } = useNotification();
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const router = useRouter();
  const { demo = "false" } = router.query;

  useEffect(() => {
    const { demo } = router.query;
    if (demo === "true") {
      localStorage.setItem("openDemo", "true");
    }
  }, [router.query]);

  useEffect(() => {
    if (
      heliconeAuthClient.user &&
      heliconeAuthClient.user.id &&
      heliconeAuthClient.user.email &&
      heliconeAuthClient.user.email !== DEMO_EMAIL
    ) {
      router.push(`/welcome`);
    }
  }, [heliconeAuthClient.user, router]);

  return (
    <PublicMetaData
      description={
        "How developers build AI applications. Get observability, tooling, fine-tuning, and evaluations out of the box. "
      }
      ogImageUrl={"https://www.helicone.ai/static/helicone-og.webp"}
    >
      {demo === "true" && <InfoBanner />}

      <AuthForm
        handleEmailSubmit={async (email: string, password: string) => {
          const origin = window.location.origin;
          console.log("signing up");

          const { data, error } = await heliconeAuthClient.signUp({
            email: email,
            password: password,
            options: {
              emailRedirectTo: `${origin}/onboarding`,
            },
          });

          if (error) {
            setNotification(
              "Error creating your account. Please try again.",
              "error",
            );
            console.error(error);
            return;
          }

          setShowEmailConfirmation(true);
        }}
        handleGoogleSubmit={async () => {
          const { error } = await heliconeAuthClient.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: `${origin}/onboarding`,
            },
          });
          if (error) {
            setNotification(
              "Error creating your account. Please try again.",
              "error",
            );
            console.error(error);
            return;
          }
        }}
        handleGithubSubmit={async () => {
          const { error } = await heliconeAuthClient.signInWithOAuth({
            provider: "github",
            options: {
              redirectTo: `${origin}/onboarding`,
            },
          });
          if (error) {
            setNotification(
              "Error creating your account. Please try again.",
              "error",
            );
            console.error(error);
            return;
          }
        }}
        authFormType={"signup"}
      />
      <ThemedModal
        open={showEmailConfirmation}
        setOpen={setShowEmailConfirmation}
      >
        <div className="flex w-full min-w-[300px] flex-col items-center justify-center space-y-4 p-2 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Confirm your email
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Please check your email for a confirmation link.
          </p>
          <div className="pt-4">
            <InboxArrowDownIcon className="h-16 w-16 text-gray-700" />
          </div>
        </div>
      </ThemedModal>
    </PublicMetaData>
  );
};

export default SignUp;

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  if (env("NEXT_PUBLIC_IS_ON_PREM") === "true") {
    return {
      props: {},
    };
  }

  // if the base path contains localhost or vercel, do nothing
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://us.helicone.ai");
  return {
    redirect: {
      destination: `${appUrl}/signin`,
      permanent: true,
    },
  };
};
