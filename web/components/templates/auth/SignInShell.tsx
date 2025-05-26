import LoadingAnimation from "@/components/shared/loadingAnimation";
import { useHeliconeAuthClient } from "@/packages/common/auth/client/AuthClientFactory";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { useEffect } from "react";
import PublicMetaData from "@/components/layout/public/publicMetaData";
import useNotification from "@/components/shared/notification/useNotification";
import AuthForm from "@/components/templates/auth/authForm";
import { Result } from "@/packages/common/result";

interface SignInShellProps {
  customerPortal?: Result<
    {
      domain: string;
      logo: string;
    },
    string
  >;
}

const SignInShell = ({ customerPortal }: SignInShellProps) => {
  const heliconeAuthClient = useHeliconeAuthClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { setNotification } = useNotification();
  const [searchParams] = useSearchParams();

  const customerPortalContent = customerPortal?.data || undefined;
  const unauthorized = searchParams.get("unauthorized");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Handle unauthorized and user state
    if (
      unauthorized === "true" &&
      heliconeAuthClient &&
      heliconeAuthClient.user?.id
    ) {
      heliconeAuthClient
        .refreshSession()
        .then(heliconeAuthClient.getUser)
        .then((user) => {
          if (!user.data || !user.data.id) {
            heliconeAuthClient.signOut().then(() => {
              setNotification(
                "You have been logged out due to unauthorized access.",
                "error"
              );
            });
          }
        });
    } else if (heliconeAuthClient.user?.id) {
      const pi_session = searchParams.get("pi_session");
      navigate(pi_session ? "/pi/onboarding" : "/dashboard");
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
      window.location.href = "https://us.helicone.ai/signin";
      return;
    }
  }, [
    unauthorized,
    heliconeAuthClient,
    setNotification,
    navigate,
    location,
    searchParams,
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
              navigate("/dashboard");
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

export default SignInShell;
