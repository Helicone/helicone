import { User } from "@supabase/auth-helpers-react";
import { ReactElement } from "react";

import AuthLayout from "../components/layout/auth/authLayout";
import DashboardPage from "../components/templates/dashboard/dashboardPage";
import { withAuthSSR } from "../lib/api/handlerWrappers";
import {
  OrganizationFilter,
  OrganizationLayout,
} from "../services/lib/organization_layout/organization_layout";
import { getSupabaseServer } from "../lib/supabaseServer";

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

  return {
    props: {
      user,
    },
  };
});
