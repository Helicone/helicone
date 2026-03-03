import { InboxArrowDownIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import useNotification from "../components/shared/notification/useNotification";
import ThemedModal from "../components/shared/themed/themedModal";
import AuthForm from "../components/templates/auth/authForm";
import { DEMO_EMAIL } from "../lib/constants";
import PublicMetaData from "../components/layout/public/publicMetaData";
import { useHeliconeAuthClient } from "@/packages/common/auth/client/AuthClientFactory";
import { logger } from "@/lib/telemetry/logger";

const SecretSignUp = () => {
  const heliconeAuthClient = useHeliconeAuthClient();
  const { setNotification } = useNotification();
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const router = useRouter();

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
      <AuthForm
        handleEmailSubmit={async (email: string, password: string) => {
          const origin = window.location.origin;
          logger.info({ email, origin }, "User signing up with email");

          const { error } = await heliconeAuthClient.signUp({
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
            logger.error({ error, email }, "Email sign up failed");
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
            logger.error({ error }, "Google OAuth sign up failed");
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
            logger.error({ error }, "GitHub OAuth sign up failed");
            return;
          }
        }}
        showSSOButton={true}
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

export default SecretSignUp;
