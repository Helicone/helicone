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
            <div className="flex flex-row gap-3 space-y-4 items-center text-center">
              <div className="text-2xl font-sans">STOP: </div>
              If you are already using the `Helicone-Auth` header, you do not
              need to do anything.
            </div>

            <div className="flex flex-col space-y-4">
              <p className="text-5xl font-sans">Migration</p>
              <p className="text-lg font-sans">
                Helicone is committed to providing the best and most secure
                experience for our users. To ensure your data is secure, we will
                be changing our integration strategy with your endpoint to
                consume a Helicone API key.
              </p>
              <p className="text-lg font-sans">
                We are asking users to make this change ASAP. We will be
                migrating our systems to use the Helicone API key on{" "}
                <b>05/05/2023</b>.
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
                You need to replace the OpenAI base URL with Helicone. You can
                find the instructions for your language below.
              </p>
              <BaseUrlInstructions apiKey="<HELICONE_API_KEY>" />
            </div>
            <div className="flex flex-col space-y-4">
              <p className="text-3xl font-sans">Benefits of this change</p>
              <p className="text-lg font-sans">
                1. This change will allow us to provide a more secure experience
                for our users. We will be able to provide more granular control
                over your API key and offer more features in the future.
              </p>
              <p className="text-lg font-sans">
                2. If you lose your OpenAI key, you don{"'"}t have to worry
                about contacting us to lock down your data, since we are no
                longer using it as a way of authentication.
              </p>
              <p className="text-lg font-sans">
                3. You will no longer need to enter your OpenAI API key into our
                system. This will allow you to keep your API key secure and not
                have to worry about it being leaked.
              </p>
              <p className="text-lg font-sans">
                4. If your OpenAI key changes or if you have multiple API keys,
                you will not have to add them back into our system.
              </p>
              <p className="text-lg font-sans">
                5. Your dashboard and overall user experience using the app will
                be faster and smoother since we do not have to cross-reference
                your OpenAI API key.
              </p>
            </div>
            <div className="flex flex-col space-y-4">
              <p className="text-3xl font-sans">FAQ</p>
              <p className="text-lg font-sans">What will happen to my data?</p>
              <p className="pl-5 text-lg font-sans">
                Your data will be safe and secure. Once all of our customers
                have started using the Helicone API key, we will migrate all of
                your data to the new system.
              </p>

              <p className="text-lg font-sans">
                What if I have multiple accounts using the same OpenAI API key?
              </p>
              <p className="pl-5 text-lg font-sans">
                For the few users that fall under this category, we will work
                with you and provide a solution, please check your emails or
                Discord for our messages.
              </p>

              <p className="text-lg font-sans">
                Do I have to make this change by the deadline? What if I don
                {"'"}t?
              </p>
              <p className="pl-5 text-lg font-sans">
                We will continue logging your data using the old system until
                June 2023, but your data will not be showing up in the dashboard
                and will require a manual migration to the new system.
              </p>
            </div>
          </div>
        </div>
      </BasePageV2>
    </MetaData>
  );
};

export default Home;
