import { HeliconeUser } from "@/packages/common/auth/types";
import { ReactElement } from "react";
import AuthLayout from "../components/layout/auth/authLayout";
import DashboardPage from "../components/templates/dashboard/dashboardPage";
import { GetServerSidePropsContext } from "next";

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

export const getServerSideProps = async (
  _context: GetServerSidePropsContext,
) => {
  return {
    props: {
      user: {
        id: "",
      },
    },
  };
};
