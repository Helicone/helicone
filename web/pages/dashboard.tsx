import { useUser } from "@supabase/auth-helpers-react";
import AuthLayout from "../components/shared/layout/authLayout";
import MetaData from "../components/shared/metaData";
import DashboardPage from "../components/templates/dashboard/dashboardPage";
import { withAuthSSR } from "../lib/api/handlerWrappers";
import { requestOverLimit } from "../lib/checkRequestLimit";
import { getKeys } from "../services/lib/keys";
import { Database } from "../supabase/database.types";
import { checkOnboardedAndUpdate } from "./api/user/checkOnboarded";

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
  const [{ data: keyData }, isRequestLimitOver, hasOnboarded] =
    await Promise.all([
      getKeys(client),
      requestOverLimit(client, orgId),
      checkOnboardedAndUpdate(client),
    ]);
  if (!hasOnboarded) {
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
