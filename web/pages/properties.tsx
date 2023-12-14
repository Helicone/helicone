import { useUser } from "@supabase/auth-helpers-react";
import AuthLayout from "../components/shared/layout/authLayout";
import MetaData from "../components/shared/metaData";
import PropertiesPage from "../components/templates/properties/propertiesPage";
import { withAuthSSR } from "../lib/api/handlerWrappers";
import { Database } from "../supabase/database.types";

interface DashboardProps {
  keys: Database["public"]["Tables"]["user_api_keys"]["Row"][];
}

const Dashboard = (props: DashboardProps) => {
  const user = useUser();
  return (
    <MetaData title="Properties">
      <AuthLayout user={user!}>
        <PropertiesPage />
      </AuthLayout>
    </MetaData>
  );
};

export default Dashboard;

export const getServerSideProps = withAuthSSR(async (options) => {
  return {
    props: {},
  };
});
