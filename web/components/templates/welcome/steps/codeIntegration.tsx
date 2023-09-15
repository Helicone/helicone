import { useEffect, useState } from "react";
import { clsx } from "../../../shared/clsx";
import CodeSnippet from "../../home/codeSnippet";
import { UnionProviderMethods } from "@/types";
import AnthropicProxy from "./codeSnippets/anthropic-proxy";
import OpenAIAsync from "./codeSnippets/openai-async";
import { PROVIDER_METHODS } from "@/lib/constants";

interface CodeIntegrationProps {
  nextStep?: () => void;
  providerMethod?: UnionProviderMethods;
  apiKey?: string;
}

const CodeIntegration = (props: CodeIntegrationProps) => {
  const {
    nextStep,
    providerMethod = "openai-proxy",
    apiKey = "<YOUR_API_KEY>",
  } = props;
  const foundMethod = PROVIDER_METHODS.find((el) => el.val === providerMethod);

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
        {foundMethod?.label}
      </p>
      <p className="text-md md:text-lg text-gray-700 font-light mt-5 text-center">
        Choose your preferred platform and follow the directions
      </p>
      <div className="flex w-full md:w-[650px] mt-8">
        {providerMethod === "openai-proxy" && (
          <CodeSnippet
            variant="simple"
            apiKey={apiKey === "" ? "<YOUR_API_KEY>" : apiKey}
          />
        )}
        {providerMethod === "openai-async" && (
          <OpenAIAsync apiKey={apiKey === "" ? "<YOUR_API_KEY>" : apiKey} />
        )}
        {providerMethod === "anthropic-proxy" && (
          <AnthropicProxy apiKey={apiKey === "" ? "<YOUR_API_KEY>" : apiKey} />
        )}
      </div>
      {nextStep && (
        <button
          onClick={nextStep}
          className="px-28 py-3 bg-gray-900 hover:bg-gray-700 font-medium text-white rounded-xl mt-8"
        >
          Ready to go!
        </button>
      )}
    </div>
  );
};

export default CodeIntegration;
