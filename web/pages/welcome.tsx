import MetaData from "../components/shared/metaData";
import WelcomePage from "../components/templates/welcome/welcomePage";

interface WelcomeProps {}

const Welcome = (props: WelcomeProps) => {
  return (
    <MetaData title="Welcome">
      <WelcomePage />
    </MetaData>
  );
};

export default Welcome;
