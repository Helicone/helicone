import BasePageV2 from "../components/shared/layout/basePageV2";
import MetaData from "../components/shared/metaData";
import WelcomePage from "../components/templates/welcome/welcomePage";
import { withAuthSSR } from "../lib/api/handlerWrappers";
import { requestOverLimit } from "../lib/checkRequestLimit";

interface DashboardProps {}

const Dashboard = (props: DashboardProps) => {
  return (
    <MetaData title="Welcome">
      <WelcomePage />
    </MetaData>
  );
};

export default Dashboard;
