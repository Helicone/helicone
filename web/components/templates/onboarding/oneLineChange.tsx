import { ArrowDownIcon, MinusIcon, PlusIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { clsx } from "../../shared/clsx";

interface OneLineChangeProps {
  onBackHandler: () => void;
  onNextHandler: () => void;
}

const OneLineChange = (props: OneLineChangeProps) => {
  const { onBackHandler, onNextHandler } = props;
  const [lang, setLang] = useState<"python" | "curl" | "node">("node");

  const setLangHandler = (lang: "python" | "curl" | "node") => {
    setLang(lang);
  };

  const codeSnippet = () => {
    switch (lang) {
      case "python":
        return (
          <>
            <div className="flex flex-row gap-2">
              <p className="text-gray-300">
                # Change the default base API url to Helicone&apos;s
              </p>
            </div>
            <div className="flex flex-row gap-2">
              <p className="text-red-500">import </p>
              <p className="text-gray-300">openai </p>
            </div>
            <div className="flex flex-row gap-2">
              <p className="text-gray-300">openai.api_base</p>
              <p className="text-blue-300">=</p>
              <p className="text-blue-400">
                &quot;https://oai.hconeai.com/v1&quot;
              </p>
            </div>
          </>
        );
      case "curl":
        return (
          <>
            <div className="flex flex-row gap-2">
              <p className="text-gray-300">Replace the OpenAI base url</p>
            </div>
            <div className="flex flex-row gap-2">
              <p className="text-purple-500">POST </p>
              <p className="text-red-500">https://api.openai.com/v1</p>
            </div>
            <div className="flex flex-row gap-2 mt-4">
              <p className="text-gray-300">with Helicone</p>
            </div>
            <div className="flex flex-row gap-2">
              <p className="text-purple-500">POST </p>
              <p className="text-green-500">https://oai.hconeai.com/v1</p>
            </div>
          </>
        );
      case "node":
        return (
          <>
            <div className="flex flex-row gap-2">
              <p className="text-gray-300">
                {`//`} Add a basePath to the Configuration:
              </p>
            </div>
            <div className="flex flex-row xs:gap-0.5 gap-1">
              <p className="text-red-500">import</p>
              <p className="text-blue-300">{`{`}</p>
              <p className="text-gray-300">Configuration,OpenAIApi </p>
              <p className="text-blue-300">{`}`}</p>
              <p className="text-red-500">from</p>
              <p className="text-blue-300">{`"openai"`}</p>
            </div>
            <div className="flex flex-col">
              <div className="flex flex-row gap-2">
                <p className="text-red-500">const </p>
                <p className="text-blue-300">configuration </p>
                <p className="text-red-500">= new</p>
                <div className="flex flex-row">
                  <p className="text-purple-400">Configuration</p>
                  <p className="text-blue-300">{`(`} </p>
                  <p className="text-orange-500">{`{`}</p>
                </div>
              </div>
              <div className="flex flex-row gap-0 ml-4">
                <p className="text-gray-300">apiKey: process.env.</p>
                <div className="flex flex-row">
                  <p className="text-blue-300">OPENAI_API_KEY</p>
                  <p className="text-gray-300">,</p>
                </div>
              </div>
              <div className="flex flex-row gap-2 pl-4 bg-green-900">
                <div className="flex flex-row">
                  <p className="text-green-700 -ml-3 pr-1">+</p>
                  <p className="text-gray-300">basePath:</p>
                </div>

                <div className="flex flex-row">
                  <p className="text-blue-300">{`"https://oai.hconeai.com/v1"`}</p>
                  <p className="text-gray-300">,</p>
                </div>
              </div>
              <div className="flex flex-row">
                <p className="text-orange-500">{`}`}</p>
                <p className="text-blue-300">{`)`} </p>
                <p className="text-gray-300">;</p>
              </div>
            </div>
            <div className="flex flex-row gap-2">
              <p className="text-red-500">const </p>
              <p className="text-blue-300">openai </p>
              <p className="text-red-500">= new</p>
              <div className="flex flex-row">
                <p className="text-purple-400">OpenAIApi</p>
                <p className="text-blue-300">{`(configuration)`} </p>
                <p className="text-gray-300">;</p>
              </div>
            </div>
          </>
        );
      default:
        return <div>c</div>;
    }
  };

  return (
    <>
      <p className="font-mono text-md pb-4 mb-4 border-b border-black">
        Step 1: Replace the OpenAI base url with Helicone
      </p>
      {/* <div className="flex flex-col border border-black rounded-lg p-8 items-center text-white text-lg sm:text-2xl bg-gray-400">
        <div className="flex flex-row bg-red-900">
          <MinusIcon className="h-4 w-4 mt-4 mx-4" />
          <code className="py-2 px-4 bg-red-800">
            <span className="p-1 rounded-md bg-red-700">api.openai</span>
            .com/v1
          </code>
        </div>

        <ArrowDownIcon className="h-6 w-6 my-2 text-black" />
        <div className="flex flex-row bg-green-900">
          <PlusIcon className="h-4 w-4 mt-4 mx-4" />
          <code className="py-2 px-4  bg-green-800">
            <span className="p-1 rounded-md bg-green-700">oai.hconeai</span>
            .com/v1
          </code>
        </div>
      </div> */}
      <div className="p-2 max-w-lg w-full">
        <div className="overflow-hidden rounded-xl bg-gray-900 ring-1 ring-white/10">
          <div className="flex bg-gray-800/40 ring-1 ring-white/5">
            <div className="-mb-px flex text-xs font-medium leading-6 text-gray-400">
              <button
                onClick={() => setLangHandler("node")}
                className={clsx(
                  lang === "node"
                    ? "border-b border-r border-b-white/20 border-r-white/10 bg-white/5 py-2 px-4 text-white"
                    : "border-r border-gray-600/10 py-2 px-4"
                )}
              >
                Node.js
              </button>
              <button
                onClick={() => setLangHandler("python")}
                className={clsx(
                  lang === "python"
                    ? "border-b border-r border-b-white/20 border-r-white/10 bg-white/5 py-2 px-4 text-white"
                    : "border-r border-gray-600/10 py-2 px-4"
                )}
              >
                Python
              </button>
              <button
                onClick={() => setLangHandler("curl")}
                className={clsx(
                  lang === "curl"
                    ? "border-b border-r border-b-white/20 border-r-white/10 bg-white/5 py-2 px-4 text-white"
                    : "border-r border-gray-600/10 py-2 px-4"
                )}
              >
                Curl
              </button>
            </div>
          </div>
          <div className="px-6 pt-6 pb-8 min-h-[20em] flex flex-col gap-4 font-mono text-[10px] sm:text-sm">
            {codeSnippet()}
          </div>
        </div>
      </div>
      <div className="mt-8 flex flex-row w-full sm:w-2/5 justify-end">
        {/* <button
          onClick={onBackHandler}
          className="rounded-md bg-gray-100 text-black px-3.5 py-1.5 text-base font-semibold leading-7 shadow-sm hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Back
        </button> */}
        <button
          onClick={onNextHandler}
          className="rounded-md bg-black px-3.5 py-1.5 text-base font-semibold leading-7 text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Next
        </button>
      </div>
      <div className="sm:text-sm text-blue">
        <span>By using our API, you agree to our </span>
        <a href="https://www.helicone.ai/privacy" className="text-blue-500">
          Privacy Policy
        </a>{" "}
        and{" "}
        <a href="https://www.helicone.ai/terms" className="text-blue-500">
          Terms of Service
        </a>{" "}
        agreements
      </div>
    </>
  );
};

export default OneLineChange;
