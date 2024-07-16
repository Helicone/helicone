import BasePageV2 from "../components/layout/basePageV2";
import MetaData from "../components/layout/public/authMetaData";
import { OpenStatsPage } from "../components/templates/open-stats/OpenStatsPage";

interface HomeProps {}
const Home = (props: HomeProps) => {
  const {} = props;

  return (
    <MetaData
      title="Home"
      image="https://us.helicone.ai/_next/image?url=%2Fassets%2Fopen_stats.webp&w=1200&q=100"
    >
      <BasePageV2>
        <OpenStatsPage />
      </BasePageV2>
    </MetaData>
  );
};

export default Home;
