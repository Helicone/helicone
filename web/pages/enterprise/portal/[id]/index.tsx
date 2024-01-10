import { User } from "@supabase/auth-helpers-nextjs";
import { GetServerSidePropsContext } from "next";
import MetaData from "../../../../components/shared/metaData";
import AuthLayout from "../../../../components/shared/layout/authLayout";
import { SupabaseServerWrapper } from "../../../../lib/wrappers/supabase";

import { useRouter } from "next/router";
import OrgSettingsPage from "../../../../components/templates/organization/settings/orgSettingsPage";
import { useGetOrg } from "../../../../services/hooks/organizations";
import PortalIdPage from "../../../../components/templates/enterprise/portal/id/portalIdPage";

interface PortalProps {
  user: User;

  orgId: string | null;
}

const Portal = (props: PortalProps) => {
  const { user, orgId } = props;
  const router = useRouter();

  // const { data, isLoading, refetch } = useGetOrg(
  //   organizationIdToEditId as string
  // );

  return (
    <MetaData title="Customer Portal">
      <AuthLayout user={user}>
        <PortalIdPage orgId={orgId} />
        {/* {organizationIdToEdit.data && (
          <OrgSettingsPage org={organizationIdToEdit.data} variant="reseller" />
        )} */}
      </AuthLayout>
    </MetaData>
  );
};

export default Portal;

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

  // get the query param q from the url
  const { id } = ctx.query;

  return {
    props: {
      initialSession: session,
      user: session.user,
      orgId: id || null,
    },
  };
};
