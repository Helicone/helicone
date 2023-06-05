import { useRouter } from "next/router";
import BasePageV2 from "../components/shared/layout/basePageV2";
import MetaData from "../components/shared/metaData";

interface HomeProps {}

const Home = (props: HomeProps) => {
  const {} = props;

  return (
    <MetaData title="Home">
      <BasePageV2>
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between p-6 md:justify-start md:space-x-10 lg:px-8">
          <div className="py-4 max-w-3xl space-y-8">
            <div
              className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
              role="alert"
            >
              <strong className="font-bold text-xl font-sans">Note:</strong>
              <span className="block sm:inline ml-2 text-lg font-sans">
                If you are already integrated with the{" "}
                <code className="bg-gray-100 p-1 rounded">Helicone-Auth</code>{" "}
                header, no further action is required.
              </span>
            </div>

            <div className="flex flex-col space-y-4">
              <h2 className="text-3xl font-sans font-semibold">
                Transition from authenticating with your OpenAI Key to a
                Helicone API Key
              </h2>
              <p className="text-lg font-sans">
                Helicone is committed to providing the best and most secure
                experience for our users. To ensure your data is secure and to
                authenticate your data more safely, we will be transitioning
                from OpenAI key-based authentication to using a Helicone API
                key.
              </p>
              <p className="text-lg font-sans">
                We kindly request users to make this change as soon as possible.
                Our systems will begin using the Helicone API key on{" "}
                <b>05/05/2023</b>.
              </p>
            </div>

            <div className="flex flex-col space-y-4">
              <h3 className="text-2xl font-sans font-semibold">
                How to Switch?
              </h3>
              <ol className="list-decimal list-inside text-lg font-sans">
                <li>
                  Generate a Helicone API key by visiting the{" "}
                  <a
                    className="text-purple-500 hover:text-purple-700 font-bold"
                    href="/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Keys page
                  </a>{" "}
                  (you may need to log in).
                </li>
                <li>
                  In your existing integrations, authenticate with the Helicone
                  API key in a header{" "}
                  {
                    <code className="bg-gray-100 p-1 rounded">
                      Helicone-Auth
                    </code>
                  }
                  . Find the instructions for your package below.
                </li>
              </ol>
              {/* <BaseUrlInstructions apiKey="HELICONE_API_KEY" /> */}
            </div>
            <div className="flex flex-col space-y-4">
              <h3 className="text-2xl font-sans font-semibold">
                Why this transition?
              </h3>
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
              <h3 className="text-2xl font-sans font-semibold">
                Frequently Asked Questions
              </h3>
              <dl className="text-lg font-sans space-y-4">
                <dt>What will happen to my data?</dt>
                <dd className="pl-5 text-lg font-sans">
                  Your data will remain safe and secure. Once all users have
                  switched to the Helicone API key, we will seamlessly transfer
                  your data to the new system.
                </dd>
                <dt>
                  What if I have multiple accounts using the same OpenAI API
                  key?
                </dt>
                <dd className="pl-5 text-lg font-sans">
                  For users with this configuration, we will provide a tailored
                  solution. Please check your emails or Discord for our
                  communications.
                </dd>
                <dt>
                  Do I have to make this change by the deadline? What if I
                  don&apos;t?
                </dt>
                <dd className="pl-5 text-lg font-sans">
                  We will continue logging your data using the old system until
                  June 2023. However, your data will not appear in the dashboard
                  and will require a manual transition to the new system.
                </dd>
                <dt>
                  Will my API forwarding to OpenAI stop working during the
                  transition?
                </dt>
                <dd className="pl-5 text-lg font-sans">
                  No, your API forwarding to OpenAI will continue to function
                  without interruption during the transition process.
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </BasePageV2>
    </MetaData>
  );
};

export default Home;
