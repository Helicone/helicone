import BasePageV2 from "../components/layout/basePageV2";
import MetaData from "../components/layout/public/authMetaData";
import { OpenStatsPage } from "../components/templates/open-stats/OpenStatsPage";

interface HomeProps {}
const Home = (props: HomeProps) => {
  const {} = props;

  return (
    <div className="dark">
      <MetaData
        title="Open Stats"
        image="https://us.helicone.ai/assets/open_stats.webp"
        description="Explore our open-sourced LLM usage metrics: 1.5B+ requests, 1108B+ tokens, and 16+ TB of anonymized data. Equivalent to 3000 years of continuous conversation, this is the largest open AI conversation dataset available for research and analysis."
      >
        <BasePageV2>
          <OpenStatsPage />
        </BasePageV2>
      </MetaData>
    </div>
  );
};

export default Home;
