import MetaData from "../components/layout/public/authMetaData";
import HomePage from "../components/templates/home/homePage";

const MicrosoftForStartups = () => {
  return (
    <MetaData title="Microsoft for Startups">
      <HomePage microsoftForStartups={true} />
    </MetaData>
  );
};

export default MicrosoftForStartups;
