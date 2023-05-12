import { User, useUser } from "@supabase/auth-helpers-react";
import BasePageV2 from "../components/shared/layout/basePageV2";
import MetaData from "../components/shared/metaData";
import WelcomePage from "../components/templates/welcome/welcomePage";
import { withAuthSSR } from "../lib/api/handlerWrappers";
import { requestOverLimit } from "../lib/checkRequestLimit";
import { getKeys } from "../services/lib/keys";
import { Database } from "../supabase/database.types";

interface DashboardProps {
  keys: Database["public"]["Tables"]["user_api_keys"]["Row"][];
}

const Dashboard = (props: DashboardProps) => {
  const { keys } = props;
  const user = useUser();

  return (
    <MetaData title="Welcome">
      <BasePageV2>
        <WelcomePage user={user!} keys={keys} />
      </BasePageV2>
    </MetaData>
  );
};

export default Dashboard;

export const getServerSideProps = withAuthSSR(async (options) => {
  const {
    userData: { orgId },
    supabaseClient,
  } = options;
  const supabase = supabaseClient.getClient();

  const [{ data: keyData }, isRequestLimitOver] = await Promise.all([
    getKeys(supabase),
    requestOverLimit(supabase, orgId),
  ]);

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
