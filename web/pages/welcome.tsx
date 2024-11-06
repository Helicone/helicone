import { GetServerSidePropsContext } from "next";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";
import { useOrg } from "@/components/layout/organizationContext";
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
  console.log("org", org);

  useEffect(() => {
    if (org) {
      if (org.allOrgs.length > 0) {
        console.log("HELLOO");
        router.push("/dashboard");
      }
    }
  }, [org, router]);
  return (
    <LoadingAnimation />
    // <MetaData title="Welcome">
    //   {/* <div>Welcome</div> */}
    //   <WelcomePage currentStep={currentStep} />
    // </MetaData>
  );
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
