import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import useNotification from "../components/shared/notification/useNotification";
import AuthForm from "../components/templates/auth/authForm";
import { GetServerSidePropsContext } from "next";
import { isCustomerDomain } from "../lib/customerPortalHelpers";
import { supabaseServer } from "../lib/supabaseServer";
import { Result, err, ok } from "../lib/result";
import PublicMetaData from "../components/layout/public/publicMetaData";

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

  if (user) {
    router.push("/dashboard");
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
    </PublicMetaData>
  );
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  if (isCustomerDomain(context.req.headers.host ?? "")) {
    const org = await supabaseServer
      .from("organization")
      .select("*")
      .eq("domain", context.req.headers.host)
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
  return {
    props: {},
  };
};

export default SignIn;
