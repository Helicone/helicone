import { InboxArrowDownIcon } from "@heroicons/react/24/outline";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useState } from "react";
import useNotification from "../components/shared/notification/useNotification";
import ThemedModal from "../components/shared/themed/themedModal";
import AuthForm from "../components/templates/auth/authForm";
import { DEMO_EMAIL } from "../lib/constants";
import PublicMetaData from "../components/layout/public/publicMetaData";
import { GetServerSidePropsContext } from "next";

const SignUp = () => {
  const supabase = useSupabaseClient();
  const { setNotification } = useNotification();
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);

  const user = useUser();
  const router = useRouter();

  if (user && user.email !== DEMO_EMAIL) {
    router.push("/welcome");
  }

  return (
    <PublicMetaData
      description={
        "How developers build AI applications. Get observability, tooling, fine-tuning, and evaluations out of the box. "
      }
      ogImageUrl={"https://www.helicone.ai/static/helicone-og.webp"}
    >
      <AuthForm
        handleEmailSubmit={async (email: string, password: string) => {
          const origin = window.location.origin;

          const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
              emailRedirectTo: `${origin}/welcome`,
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

          setShowEmailConfirmation(true);
        }}
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
  if (process.env.NEXT_PUBLIC_IS_ON_PREM === "true") {
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

  // default to the https://us.helicone.ai/signin if no other conditions are met
  return {
    redirect: {
      destination: "https://us.helicone.ai/signin",
      permanent: true,
    },
  };
};
