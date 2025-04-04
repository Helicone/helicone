import { HeliconeUser } from "@/packages/common/auth/types";
import { ReactElement } from "react";
import AuthLayout from "../components/layout/auth/authLayout";
import DashboardPage from "../components/templates/dashboard/dashboardPage";
import { withAuthSSR } from "../lib/api/handlerWrappers";

interface DashboardProps {
  user: HeliconeUser;
}

const Dashboard = (props: DashboardProps) => {
  const { user } = props;

  return <DashboardPage user={user} />;
};

Dashboard.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Dashboard;

export const getServerSideProps = withAuthSSR(async (options) => {
  return {
    props: {
      user: {
        id: options.userData.user.id,
        email: options.userData.user.email,
      },
    },
  };
});
