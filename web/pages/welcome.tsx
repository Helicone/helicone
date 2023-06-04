import BasePageV2 from "../components/shared/layout/basePageV2";
import MetaData from "../components/shared/metaData";
import WelcomePage from "../components/templates/welcome/welcomePage";
import { withAuthSSR } from "../lib/api/handlerWrappers";
import { requestOverLimit } from "../lib/checkRequestLimit";

interface DashboardProps {}

const Dashboard = (props: DashboardProps) => {
  return (
    <MetaData title="Welcome">
      <BasePageV2>
        <WelcomePage />
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

  const [isRequestLimitOver] = await Promise.all([
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
    props: {},
  };
});
