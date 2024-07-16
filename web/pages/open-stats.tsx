import BasePageV2 from "../components/layout/basePageV2";
import MetaData from "../components/layout/public/authMetaData";
import { OpenStatsPage } from "../components/templates/open-stats/OpenStatsPage";

interface HomeProps {}
const Home = (props: HomeProps) => {
  const {} = props;

  return (
    <MetaData
      title="Home"
      image="https://www.helicone.ai/assets/open_stats.png"
    >
      <BasePageV2>
        <OpenStatsPage />
      </BasePageV2>
    </MetaData>
  );
};

export default Home;
