import { User } from "@supabase/auth-helpers-nextjs";
import { useOrg } from "../../components/shared/layout/organizationContext";
import AuthLayout from "../../components/shared/layout/authLayout";
import AuthHeader from "../../components/shared/authHeader";
import MetaData from "../../components/shared/metaData";
import { SupabaseServerWrapper } from "../../lib/wrappers/supabase";
import { GetServerSidePropsContext } from "next";
import OrgUsagePage from "../../components/templates/organization/usage/orgUsagePage";

interface UsageProps {
  user: User;
}

const Usage = (props: UsageProps) => {
  const { user } = props;

  const org = useOrg();

  return (
    <MetaData title="Usage">
      <AuthLayout user={user}>
        <AuthHeader title={"Organization Usage"} />
        {!org?.currentOrg ? (
          <h1>Loading...</h1>
        ) : (
          <OrgUsagePage org={org?.currentOrg!} />
        )}
      </AuthLayout>
    </MetaData>
  );
};

export default Usage;

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
