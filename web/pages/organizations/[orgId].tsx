import {
  createServerSupabaseClient,
  User,
} from "@supabase/auth-helpers-nextjs";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import AuthHeader from "../../components/shared/authHeader";
import AuthLayout from "../../components/shared/layout/authLayout";
import MetaData from "../../components/shared/metaData";
import OrgIdPage from "../../components/templates/organizationId/orgIdPage";
import { useGetOrgs } from "../../services/hooks/organizations";

interface OrganizationIdProps {
  user: User;
}

const OrganizationId = (props: OrganizationIdProps) => {
  const { user } = props;
  const router = useRouter();
  const { orgId } = router.query;

  const { data, isLoading } = useGetOrgs();

  const organization = data?.find((org) => org.id === orgId) as {
    created_at: string | null;
    id: string;
    is_personal: boolean;
    name: string;
    owner: string;
    soft_delete: boolean;
    color: string | null;
    icon: string | null;
  };

  if (isLoading) {
    return (
      <MetaData title="Organizations">
        <AuthLayout user={user}>
          <AuthHeader title={"Organizations"} />
        </AuthLayout>
      </MetaData>
    );
  }

  return (
    <MetaData title="Organizations">
      <AuthLayout user={user}>
        <AuthHeader
          title={organization?.name || (orgId as string)}
          breadcrumb={{
            href: "/organizations",
            title: "Organizations",
          }}
        />
        <OrgIdPage org={organization} />
      </AuthLayout>
    </MetaData>
  );
};

export default OrganizationId;

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  // Create authenticated Supabase Client
  const supabase = createServerSupabaseClient(ctx);
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
