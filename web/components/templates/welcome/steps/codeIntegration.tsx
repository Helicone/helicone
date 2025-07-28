import { useEffect, useState } from "react";
import { clsx } from "../../../shared/clsx";
import CodeSnippet from "./providerIntegrations.tsx/openAISnippets";
import Link from "next/link";

interface CodeIntegrationProps {
  nextStep: () => void;
  apiKey?: string;
}

const CodeIntegration = (props: CodeIntegrationProps) => {
  const { nextStep, apiKey = "<YOUR_API_KEY>" } = props;

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 500); // delay of 500ms
    return () => clearTimeout(timer); // this will clear Timeout
    // when component unmount like in willComponentUnmount
  }, []);

  return (
    <div
      className={clsx(
        `transition-all duration-700 ease-in-out ${
          loaded ? "opacity-100" : "opacity-0"
        }`,
        "flex w-full flex-col items-center px-2",
      )}
    >
      <p className="text-lg font-semibold md:text-3xl">
        OpenAI Proxy Integration
      </p>
      <div className="mt-5 max-w-3xl text-center text-sm font-light text-gray-500 md:text-lg">
        We recommend using the proxy, but we also support OpenAI&apos;s packages{" "}
        <Link
          href={
            "https://docs.helicone.ai/getting-started/integration-method/openai"
          }
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline"
        >
          here
        </Link>
        .
        <p>
          Have a different provider or fine tuned model? View our docs{" "}
          <Link
            href={
              "https://docs.helicone.ai/getting-started/integration-method/gateway"
            }
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            here
          </Link>{" "}
          to integrate.
        </p>
      </div>
      <div className="mt-8 flex w-full md:w-[650px]">
        <CodeSnippet apiKey={apiKey === "" ? "<YOUR_API_KEY>" : apiKey} />
      </div>
      <button
        onClick={() => {
          nextStep();
        }}
        className="mt-8 rounded-xl bg-gray-900 px-28 py-3 font-medium text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-black dark:hover:bg-gray-300"
      >
        Ready to go!
      </button>
    </div>
  );
};

export default CodeIntegration;
