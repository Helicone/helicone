import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import useNotification from "../components/shared/notification/useNotification";
import AuthForm from "../components/templates/auth/authForm";
import { GetServerSidePropsContext } from "next";
import { isCustomerDomain } from "../lib/customerPortalHelpers";
import { supabaseServer } from "../lib/supabaseServer";
import { Result, err, ok } from "../lib/result";
import PublicMetaData from "../components/layout/public/publicMetaData";
import { useEffect } from "react";
import LoadingAnimation from "@/components/shared/loadingAnimation";

export type CustomerPortalContent = {
  domain: string;
  logo: string;
};

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
  const user = useUser();
  const router = useRouter();
  const supabase = useSupabaseClient();
  const { setNotification } = useNotification();

  const customerPortalContent = customerPortal?.data || undefined;
  const { unauthorized } = router.query;
  useEffect(() => {
    if (unauthorized === "true") {
      supabase.auth.refreshSession().then((session) => {
        if (!session.data.session?.user) {
          supabase.auth.signOut().then(() => {
            setNotification(
              "You have been logged out due to unauthorized access.",
              "error"
            );
          });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unauthorized]);

  if (user) {
    router.push("/dashboard");
  }

  return (
    <PublicMetaData
      description={
        "How developers build AI applications. Get observability, tooling, fine-tuning, and evaluations out of the box."
      }
      ogImageUrl={"https://www.helicone.ai/static/helicone-og.webp"}
    >
      <div>
        {user ? (
          <div className="flex items-center justify-center h-screen flex-col">
            <LoadingAnimation />
            <h1 className="text-4xl font-semibold">Getting your dashboard</h1>
          </div>
        ) : (
          <AuthForm
            handleEmailSubmit={async (email: string, password: string) => {
              const { data, error } = await supabase.auth.signInWithPassword({
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
              const { error } = await supabase.auth.signInWithOAuth({
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
              const { error } = await supabase.auth.signInWithOAuth({
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
  if (process.env.NEXT_PUBLIC_IS_ON_PREM === "true") {
    return {
      props: {},
    };
  }

  if (isCustomerDomain(context.req.headers.host ?? "")) {
    const org = await supabaseServer
      .from("organization")
      .select("*")
      .eq("domain", context.req.headers.host ?? "")
      .single();
    if (org.data) {
      return {
        props: {
          customerPortal: ok({
            domain: org.data.domain,
            logo: org.data.logo_path,
          }),
        },
      };
    } else {
      return {
        props: {
          customerPortal: err("no org found"),
        },
      };
    }
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
