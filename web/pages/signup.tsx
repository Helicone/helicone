import { InboxArrowDownIcon } from "@heroicons/react/24/outline";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import useNotification from "../components/shared/notification/useNotification";
import ThemedModal from "../components/shared/themed/themedModal";
import AuthForm from "../components/templates/auth/authForm";
import { DEMO_EMAIL } from "../lib/constants";
import PublicMetaData from "../components/layout/public/publicMetaData";
import { GetServerSidePropsContext } from "next";
import posthog from "posthog-js";
import { InfoBanner } from "../components/shared/themed/themedDemoBanner";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";

const SignUp = () => {
  const supabase = useSupabaseClient();
  const { setNotification } = useNotification();
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);

  const user = useUser();
  const router = useRouter();
  const { demo = "false" } = router.query;

  useEffect(() => {
    const { demo } = router.query;
    if (demo === "true") {
      localStorage.setItem("openDemo", "true");
    }
  }, [router.query]);

  const handleEmailSubmit = async (email: string, password: string) => {
    const origin = window.location.origin;

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        emailRedirectTo: `${origin}/welcome?verified=true`,
      },
    });

    if (error) {
      setNotification(
        "Error creating your account. Please try again.",
        "error"
      );
      console.error(error);
      return;
    }

    posthog.capture("user_signed_up", {
      method: "email",
      email: email,
    });

    setShowEmailConfirmation(true);
  };

  return (
    <PublicMetaData
      description={
        "How developers build AI applications. Get observability, tooling, fine-tuning, and evaluations out of the box. "
      }
      ogImageUrl={"https://www.helicone.ai/static/helicone-og.webp"}
    >
      {demo === "true" && <InfoBanner />}
      <AuthForm
        handleEmailSubmit={handleEmailSubmit}
        handleGoogleSubmit={async () => {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
          });
          if (error) {
            setNotification(
              "Error creating your account. Please try again.",
              "error"
            );
            console.error(error);
            return;
          }

          posthog.capture("user_signed_up", {
            method: "google",
          });
        }}
        handleGithubSubmit={async () => {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: "github",
          });
          if (error) {
            setNotification(
              "Error creating your account. Please try again.",
              "error"
            );
            console.error(error);
            return;
          }

          posthog.capture("user_signed_up", {
            method: "github",
          });
        }}
        authFormType={"signup"}
      />
      <ThemedModal
        open={showEmailConfirmation}
        setOpen={setShowEmailConfirmation}
      >
        <div className="flex flex-col space-y-4 w-full min-w-[300px] justify-center text-center items-center p-2">
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
  context: GetServerSidePropsContext
) => {
  const supabase = createServerSupabaseClient(context);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && user.email !== DEMO_EMAIL) {
    return {
      redirect: {
        destination: "/welcome",
        permanent: false,
      },
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

  // default to the https://us.helicone.ai/signin if no other conditions are met
  return {
    redirect: {
      destination: "https://us.helicone.ai/signin",
      permanent: true,
    },
  };
};
