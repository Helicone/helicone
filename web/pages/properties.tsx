import { User } from "@supabase/auth-helpers-react";
import AuthLayout from "../components/shared/layout/authLayout";
import MetaData from "../components/shared/metaData";
import PropertiesPage from "../components/templates/properties/propertiesPage";
import { withAuthSSR } from "../lib/api/handlerWrappers";

interface DashboardProps {
  user: User;
}

const Dashboard = (props: DashboardProps) => {
  const { user } = props;

  return (
    <MetaData title="Properties">
      <AuthLayout user={user}>
        <PropertiesPage />
      </AuthLayout>
    </MetaData>
  );
};

export default Dashboard;

export const getServerSideProps = withAuthSSR(async (options) => {
  const {
    userData: { user },
  } = options;

  return {
    props: {
      user,
    },
  };
});
