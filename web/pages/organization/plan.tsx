import { User } from "@supabase/auth-helpers-nextjs";
import { useOrg } from "../../components/shared/layout/organizationContext";
import AuthLayout from "../../components/shared/layout/authLayout";
import AuthHeader from "../../components/shared/authHeader";
import MetaData from "../../components/shared/metaData";
import { SupabaseServerWrapper } from "../../lib/wrappers/supabase";
import { GetServerSidePropsContext } from "next";
import OrgPlanPage from "../../components/templates/organization/plan/orgPlanPage";

interface PlanProps {
  user: User;
}

const Plan = (props: PlanProps) => {
  const { user } = props;

  const org = useOrg();

  return (
    <MetaData title="Plan">
      <AuthLayout user={user}>
        <AuthHeader title={"Organization Plan"} />
        {!org?.currentOrg ? (
          <h1>Loading...</h1>
        ) : (
          <OrgPlanPage org={org.currentOrg} />
        )}
      </AuthLayout>
    </MetaData>
  );
};

export default Plan;

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  // Create authenticated Supabase Client
  const supabase = new SupabaseServerWrapper(ctx).getClient();
  // Check if we have a session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session)
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };

  return {
    props: {
      initialSession: session,
      user: session.user,
    },
  };
};
