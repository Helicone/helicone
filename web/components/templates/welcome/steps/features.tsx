import Link from "next/link";
import { useEffect, useState } from "react";
import { clsx } from "../../../shared/clsx";
import ThemedModal from "../../../shared/themed/themedModal";

interface FeaturesProps {
  nextStep: () => void;
}

const featureSet = [
  {
    title: "Monitoring and Analytics",
    subtitle: "Monitor your API usage and analyze your requests",
    description: `Helicone helps you better understand your LLM usage and costs. Some of the features include:
   - Visualizing requests, including conversations or chained prompts
   - Understanding how latency varies throughout the day and when rate limits are hit
   - Identifying users with disproportional usage costs
   - Slicing metrics by prompts, finetuned models, or API keys
    `,
  },
  {
    title: "User Rate Limiting",
    subtitle: "Easily manage your users' limits",
    description:
      "Rate limits are an important feature that allows you to control the number of requests made with your API key within a specific time window. For example, you can limit users to 1000 requests per day or 60 requests per minute. By implementing rate limits, you can prevent abuse while protecting your resources from being overwhelmed by excessive traffic.",
  },
  {
    title: "Custom Properties",
    subtitle: "Add custom properties to your requests",
    description: `Custom Properties allow you to add any additional information to your requests, such as:
    - The session, conversation, or app id
    - The prompt chain by adding a common value to group of requests
    - Application or user metadata making the request
    
    Some people use custom properties to: 
    - Get the the total cost or latency for a group of requests in a prompt chain
    - Get the "unit economics" of your application, such as the average cost of a conversation or session
    - Slice and dice your requests and metrics by any custom property`,
  },
  {
    title: "Caching",
    subtitle: "Save money and time on common requests",
    description:
      "Caching, by temporarily storing data closer to the user at the edge, significantly speeds up access time and enhances application performance. This edge deployment ensures low latency, resulting in faster responses and an efficient app development process.",
  },
  {
    title: "Retries",
    subtitle: "Overcome rate limits and loaded servers",
    description:
      "To effectively deal with retries, we use a strategy called exponential backoff. Exponential backoff involves increasing the wait time between retries exponentially, which helps to spread out the request load and gives the server a chance to recover. This is done by multiplying the wait time by a factor (default is 2) for each subsequent retry.",
  },
  {
    title: "User Metrics",
    subtitle: "Track your users' usage and activity",
    description: `Get user metrics like number of requests, costs, and activity. You can achieve this by adding the user field as a parameter into the OpenAI API call. Alternatively, you can also pass the user ID via headers for Helicone to log. This overrides the OpenAI API in the logs if you specify both.
    `,
  },
  {
    title: "Streaming",
    subtitle: "Support out of the box",
    description: `Helicone smoothly integrates streaming functionality and offers benefits that you can't find with the standard OpenAI package. 
    
    Currently, OpenAI doesn't provide usage statistics such as prompt and completion tokens. However, Helicone overcomes this limitation by estimating these statistics with the help of the gpt3-tokenizer package, which is designed to work with all tokenized OpenAI GPT models.`,
  },
  {
    title: "Async Logging",
    subtitle: "Log your requests asynchronously",
    description: `Helicone works with asynchronous requests normally. We support both async requests made in stremaing mode as well as not in streaming mode.`,
  },
  {
    title: "GraphQL",
    subtitle: "Fetch and manage your data",
    description: `Helicone provides a GraphQL API to fetch and manage your data. You can use this to:

    - Fetch your requests and metrics
    - Fetch your users and their metrics
    `,
  },
  {
    title: "Multiple Providers",
    subtitle: "Support for OpenAI and Anthropic",
    description: `Helicone supports both OpenAI models and Anthropic's Claude. We plan on supporting more providers in the future.`,
  },
];

const Features = (props: FeaturesProps) => {
  const { nextStep } = props;

  const [loaded, setLoaded] = useState(false);
  const [currentFeature, setCurrentFeature] = useState<number>();
  const [showFeature, setShowFeature] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 500); // delay of 500ms
    return () => clearTimeout(timer); // this will clear Timeout
    // when component unmount like in willComponentUnmount
  }, []);

  return (
    <>
      <div
        className={clsx(
          `transition-all duration-700 ease-in-out ${
            loaded ? "opacity-100" : "opacity-0"
          }`,
          "flex flex-col items-center w-full px-2"
        )}
      >
        <p className="text-2xl md:text-5xl font-semibold text-center">
          Features
        </p>
        <p className="text-md md:text-lg text-gray-700 font-light mt-5 text-center">
          Helicone provides the tools needed for your LLM-powered application.
        </p>
        <p className="text-md md:text-lg text-gray-700 font-light text-center">
          View our{" "}
          <span>
            <Link
              href={"https://docs.helicone.ai/"}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              docs
            </Link>
          </span>{" "}
          to learn more.
        </p>
        <div className="grid grid-cols-3 w-full md:w-[62.5%] h-full gap-8 py-16 max-h-[400px] overflow-auto">
          <div className="col-span-3 md:col-span-1 flex-col w-full justify-center items-center text-center rounded-xl border border-gray-500 p-4 md:rounded-none md:border-none md:p-0">
            <p className="text-lg font-semibold text-gray-900 underline underline-offset-2">
              Monitoring & Analytics
            </p>
            <ol>
              <li className="text-md text-gray-700 font-light mt-5">
                API usage and costs
              </li>
              <li className="text-md text-gray-700 font-light mt-5">
                Errors and Distributions
              </li>
              <li className="text-md text-gray-700 font-light mt-5">
                Custom Properties
              </li>
            </ol>
          </div>
          <div className="col-span-3 md:col-span-1 flex-col w-full justify-center items-center text-center rounded-xl border border-gray-500 p-4 md:rounded-none md:border-none md:p-0">
            <p className="text-lg font-semibold text-gray-900 underline underline-offset-2">
              User Management
            </p>
            <ol>
              <li className="text-md text-gray-700 font-light mt-5">
                User Metrics
              </li>
              <li className="text-md text-gray-700 font-light mt-5">
                User Rate Limiting
              </li>
              <li className="text-md text-gray-700 font-light mt-5">
                Intelligent Retries
              </li>
            </ol>
          </div>
          <div className="col-span-3 md:col-span-1 flex-col w-full justify-center items-center text-center rounded-xl border border-gray-500 p-4 md:rounded-none md:border-none md:p-0">
            <p className="text-lg font-semibold text-gray-900 underline underline-offset-2">
              Dev Tools
            </p>
            <ol>
              <li className="text-md text-gray-700 font-light mt-5">
                Custom Properties
              </li>
              <li className="text-md text-gray-700 font-light mt-5">
                Bucket Caching
              </li>
              <li className="text-md text-gray-700 font-light mt-5">GraphQL</li>
            </ol>
          </div>
        </div>

        <button
          onClick={nextStep}
          className="px-28 py-3 bg-gray-900 hover:bg-gray-700 font-medium text-white rounded-xl mt-8"
        >
          Get Integrated
        </button>
      </div>
      <ThemedModal open={showFeature} setOpen={setShowFeature}>
        <div className="flex flex-col space-y-4 max-w-lg p-2">
          <p className="text-2xl font-semibold text-gray-900">
            {featureSet.at(currentFeature!)?.title}
          </p>
          <p className="text-lg text-gray-900 font-light whitespace-pre-line">
            {featureSet.at(currentFeature!)?.description}
          </p>
        </div>
      </ThemedModal>
    </>
  );
};

export default Features;
