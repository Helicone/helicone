import { User } from "@supabase/auth-helpers-react";
import { ReactElement } from "react";

import AuthLayout from "../components/layout/auth/authLayout";
import DashboardPage from "../components/templates/dashboard/dashboardPage";
import { withAuthSSR } from "../lib/api/handlerWrappers";
import { getSupabaseServer } from "../lib/supabaseServer";
import {
  OrganizationFilter,
  OrganizationLayout,
} from "../services/lib/organization_layout/organization_layout";

interface DashboardProps {
  user: User;
  currentFilter: OrganizationFilter | null;
  orgLayout: OrganizationLayout | null;
}

const Dashboard = (props: DashboardProps) => {
  const { user, currentFilter, orgLayout } = props;

  return (
    <DashboardPage
      user={user}
      currentFilter={currentFilter}
      organizationLayout={orgLayout}
    />
  );
};

Dashboard.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Dashboard;

export const getServerSideProps = withAuthSSR(async (options) => {
  const {
    userData: { user, orgHasOnboarded, orgId },
  } = options;
  const { context } = options;

  const { data: orgLayout, error: organizationLayoutError } =
    await getSupabaseServer()
      .from("organization_layout")
      .select("*")
      .eq("organization_id", orgId)
      .eq("type", "dashboard")
      .single();

  if (!orgLayout || organizationLayoutError) {
    return {
      props: {
        user,
        currentFilter: null,
        orgLayout: orgLayout ?? null,
      },
    };
  }

  const filterId = context.query.filter as string;

  const filters: OrganizationFilter[] =
    orgLayout.filters as OrganizationFilter[];
  const layout: OrganizationLayout = {
    id: orgLayout.id,
    type: orgLayout.type,
    filters: filters,
    organization_id: orgLayout.organization_id,
  };

  const currentFilter = filters.find((x) => x.id === filterId);

  return {
    props: {
      user,
      currentFilter: currentFilter ?? null,
      orgLayout: layout ?? null,
    },
  };
});
