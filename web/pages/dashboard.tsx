import { User, useUser } from "@supabase/auth-helpers-react";
import MetaData from "../components/shared/metaData";
import DashboardPage from "../components/templates/dashboard/dashboardPage";
import { withAuthSSR } from "../lib/api/handlerWrappers";
import { requestOverLimit } from "../lib/checkRequestLimit";
import { getKeys } from "../services/lib/keys";
import { Database } from "../supabase/database.types";
import AuthLayout from "../components/shared/layout/authLayout";
import AuthHeader from "../components/shared/authHeader";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { clsx } from "../components/shared/clsx";

interface DashboardProps {
  keys: Database["public"]["Tables"]["user_api_keys"]["Row"][];
}

const Dashboard = (props: DashboardProps) => {
  const { keys } = props;
  const user = useUser();
  return (
    <MetaData title="Dashboard">
      <AuthLayout user={user!}>
        <DashboardPage keys={keys} />
      </AuthLayout>
    </MetaData>
  );
};

export default Dashboard;

export const getServerSideProps = withAuthSSR(async (options) => {
  const {
    userData: { orgId },
    supabaseClient,
  } = options;
  const client = supabaseClient.getClient();
  const [{ data: keyData }, isRequestLimitOver] = await Promise.all([
    getKeys(client),
    requestOverLimit(client, orgId),
  ]);
  if (keyData?.length === 0) {
    return {
      redirect: {
        destination: "/welcome",
        permanent: false,
      },
    };
  }

  if (isRequestLimitOver) {
    return {
      redirect: {
        destination: "/usage",
        permanent: false,
      },
    };
  }

  return {
    props: {
      keys: keyData,
    },
  };
});
