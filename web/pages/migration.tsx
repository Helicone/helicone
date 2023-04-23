import { useRouter } from "next/router";
import BasePageV2 from "../components/shared/layout/basePageV2";
import MetaData from "../components/shared/metaData";
import { BaseUrlInstructions } from "../components/templates/welcome/welcomePage";

interface HomeProps {}

const Home = (props: HomeProps) => {
  const {} = props;

  return (
    <MetaData title="Home">
      <BasePageV2>
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between p-6 md:justify-start md:space-x-10 lg:px-8">
          <div className="py-16 max-w-3xl space-y-16">
            <div className="flex flex-col space-y-4">
              <p className="text-5xl font-sans">Migration</p>
              <p className="text-lg font-sans">
                Helicone is committed to providing the best and most secure
                experience for our users. We are currently migrating our
                integration. This will allow us to provide a more stable and
                secure experience for our users.
              </p>
              <div>
                STOP: You do not need this if you are already using the
                Helicone-Auth header.
              </div>
            </div>
            <div className="flex flex-col space-y-4">
              <p className="text-3xl font-sans">What is changing?</p>
              <p className="text-lg font-sans">
                The integration is changing so that you are putting the API key
                in the Helicone-Auth header instead of giving us your OpenAI API
                key.
              </p>
            </div>
            <div className="flex flex-col space-y-4">
              <p className="text-3xl font-sans">What do I need to do?</p>
              <p className="text-lg font-sans">
                Generate a Helicone API key and put it in the Helicone-Auth.
              </p>
              <button
                className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                onClick={() => {
                  // push to a new tab
                  window.open("/keys", "_blank", "noopener,noreferrer");
                }}
              >
                Generate API Key
              </button>
              <p className="text-lg font-sans">
                You need to replace the OpenAI base url with Helicone. You can
                find the instructions for your language below.
              </p>
              <BaseUrlInstructions apiKey="<HELICONE_API_KEY>" />
            </div>
          </div>
        </div>
      </BasePageV2>
    </MetaData>
  );
};

export default Home;
