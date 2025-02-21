import { GetServerSidePropsContext } from "next";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";
import { useOrg } from "@/components/layout/org/organizationContext";
import { useEffect } from "react";
import LoadingAnimation from "@/components/shared/loadingAnimation";
import { useRouter } from "next/router";
// import "prismjs/themes/prism.css";
interface WelcomeProps {
  currentStep: number;
}

const Welcome = (props: WelcomeProps) => {
  const { currentStep } = props;
  const org = useOrg();
  const router = useRouter();

  useEffect(() => {
    if (
      org &&
      org.allOrgs.length > 0 &&
      org.currentOrg?.tier !== "demo" &&
      org.currentOrg?.has_onboarded
    ) {
      console.log("Org has onboarded, redirecting to dashboard");
      router.push("/dashboard");
    } else {
      console.log("Org has not onboarded, redirecting to onboarding");
      router.push("/onboarding");
    }
  }, [org, router]);
  return <LoadingAnimation title="Just setting up your account..." />;
};

export default Welcome;

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const supabaseClient = new SupabaseServerWrapper(ctx);
  const supabase = supabaseClient.getClient();

  const currentSession = await supabase.auth.refreshSession();

  if (!currentSession.data.session?.user)
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };

  const { data, error } = await supabaseClient.getUserAndOrg();

  if (error !== null || !data.orgId || !data.userId) {
    return {
      redirect: {
        destination: "/signin?unauthorized=true",
        permanent: false,
      },
    };
  }

  const { step } = ctx.query;

  return {
    props: {
      initialSession: currentSession,
      user: currentSession.data.session?.user,
      currentStep: step ? parseInt(step as string) : 1,
    },
  };
};
