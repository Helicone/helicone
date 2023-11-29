import { useEffect, useState } from "react";
import { clsx } from "../../../shared/clsx";
import CodeSnippet from "../../home/codeSnippet";
import { UnionProviderMethods } from "../welcomePage";
import AnthropicProxy from "./codeSnippets/anthropic-proxy";
import OpenAIAsync from "./codeSnippets/openai-async";
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
        "flex flex-col items-center w-full px-2"
      )}
    >
      <p className="text-2xl md:text-5xl font-semibold text-center">
        OpenAI Proxy Integration
      </p>
      <div className="text-md md:text-lg text-gray-700 font-light mt-5 text-center max-w-3xl">
        We recommend using the proxy integration, but we also support OpenAI's
        packages{" "}
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
      <div className="flex w-full md:w-[650px] mt-8">
        <CodeSnippet
          variant="simple"
          apiKey={apiKey === "" ? "<YOUR_API_KEY>" : apiKey}
        />
      </div>
      <button
        onClick={nextStep}
        className="px-28 py-3 bg-gray-900 hover:bg-gray-700 font-medium text-white rounded-xl mt-8"
      >
        Ready to go!
      </button>
    </div>
  );
};

export default CodeIntegration;
