import { InboxArrowDownIcon } from "@heroicons/react/24/outline";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import useNotification from "@/components/shared/notification/useNotification";
import ThemedModal from "@/components/shared/themed/themedModal";
import AuthForm from "@/components/templates/auth/authForm";
import { DEMO_EMAIL } from "@/lib/constants";
import PublicMetaData from "@/components/layout/public/publicMetaData";
import { InfoBanner } from "@/components/shared/themed/themedDemoBanner";
import { useHeliconeAuthClient } from "@/packages/common/auth/client/AuthClientFactory";

const SignUpShell = () => {
  const heliconeAuthClient = useHeliconeAuthClient();
  const { setNotification } = useNotification();
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const demo = searchParams.get("demo") || "false";

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Handle hostname-based redirects
    const hostname = window.location.hostname;
    const isOnPrem = process.env.NEXT_PUBLIC_IS_ON_PREM === "true";

    if (!isOnPrem) {
      // Skip redirect for localhost and vercel
      if (hostname.includes("localhost") || hostname.includes("vercel")) {
        return;
      }

      // Skip redirect for us and eu subdomains
      if (hostname.includes("us") || hostname.includes("eu")) {
        return;
      }

      // Redirect to us.helicone.ai for all other cases
      window.location.href = "https://us.helicone.ai/signup";
      return;
    }

    if (demo === "true") {
      localStorage.setItem("openDemo", "true");
    }
  }, [demo]);

  useEffect(() => {
    if (
      heliconeAuthClient.user &&
      heliconeAuthClient.user.id &&
      heliconeAuthClient.user.email &&
      heliconeAuthClient.user.email !== DEMO_EMAIL
    ) {
      navigate("/welcome");
    }
  }, [heliconeAuthClient.user, navigate]);

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
              "error"
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
              "error"
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

export default SignUpShell;
