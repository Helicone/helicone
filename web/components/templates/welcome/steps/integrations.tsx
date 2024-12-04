import { useState } from "react";
import Image from "next/image";
import { clsx } from "../../../shared/clsx";
import CodeSnippet from "./providerIntegrations.tsx/openAISnippets";
import AzureSnippets from "./providerIntegrations.tsx/azureSnippets";
import AnthropicSnippets from "./providerIntegrations.tsx/anthropicSnippets";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface IntegrationsProps {
  apiKey: string;
  previousStep: () => void;
  nextStep: () => void;
}

const Integrations = (props: IntegrationsProps) => {
  const { apiKey, previousStep, nextStep } = props;

  const [selectedProvider, setSelectedProvider] = useState<
    "openai" | "azure" | "anthropic"
  >("openai");

  const renderProviderObject = {
    openai: <CodeSnippet apiKey={apiKey} />,
    azure: <AzureSnippets apiKey={apiKey} />,
    anthropic: <AnthropicSnippets apiKey={apiKey} />,
  };

  return (
    <div id="content" className="w-full flex flex-col">
      <div className="flex flex-col p-4 w-full">
        <h2 className="text-2xl font-semibold pb-8">
          Integrate your application
        </h2>
        <label className="font-semibold text-sm">Select your provider</label>
        <div className="flex flex-wrap gap-4 pt-2 w-full">
          <button
            className={clsx(
              selectedProvider === "openai" ? "bg-sky-100" : "bg-white",
              "flex items-center gap-2 border border-gray-300 rounded-lg py-2 px-4"
            )}
            onClick={() => setSelectedProvider("openai")}
          >
            <svg
              className="w-[1.60625rem] m:w-[1.375rem] h-auto"
              width="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M26.153 11.46a6.888 6.888 0 0 0-.608-5.73 7.117 7.117 0 0 0-3.29-2.93 7.238 7.238 0 0 0-4.41-.454 7.065 7.065 0 0 0-2.41-1.742A7.15 7.15 0 0 0 12.514 0a7.216 7.216 0 0 0-4.217 1.346 7.061 7.061 0 0 0-2.603 3.539 7.12 7.12 0 0 0-2.734 1.188A7.012 7.012 0 0 0 .966 8.268a6.979 6.979 0 0 0 .88 8.273 6.89 6.89 0 0 0 .607 5.729 7.117 7.117 0 0 0 3.29 2.93 7.238 7.238 0 0 0 4.41.454 7.061 7.061 0 0 0 2.409 1.742c.92.404 1.916.61 2.923.604a7.215 7.215 0 0 0 4.22-1.345 7.06 7.06 0 0 0 2.605-3.543 7.116 7.116 0 0 0 2.734-1.187 7.01 7.01 0 0 0 1.993-2.196 6.978 6.978 0 0 0-.884-8.27Zm-10.61 14.71c-1.412 0-2.505-.428-3.46-1.215.043-.023.119-.064.168-.094l5.65-3.22a.911.911 0 0 0 .464-.793v-7.86l2.389 1.36a.087.087 0 0 1 .046.065v6.508c0 2.952-2.491 5.248-5.257 5.248ZM4.062 21.354a5.17 5.17 0 0 1-.635-3.516c.042.025.115.07.168.1l5.65 3.22a.928.928 0 0 0 .928 0l6.898-3.93v2.72a.083.083 0 0 1-.034.072l-5.711 3.255a5.386 5.386 0 0 1-4.035.522 5.315 5.315 0 0 1-3.23-2.443ZM2.573 9.184a5.283 5.283 0 0 1 2.768-2.301V13.515a.895.895 0 0 0 .464.793l6.897 3.93-2.388 1.36a.087.087 0 0 1-.08.008L4.52 16.349a5.262 5.262 0 0 1-2.475-3.185 5.192 5.192 0 0 1 .527-3.98Zm19.623 4.506-6.898-3.93 2.388-1.36a.087.087 0 0 1 .08-.008l5.713 3.255a5.28 5.28 0 0 1 2.054 2.118 5.19 5.19 0 0 1-.488 5.608 5.314 5.314 0 0 1-2.39 1.742v-6.633a.896.896 0 0 0-.459-.792Zm2.377-3.533a7.973 7.973 0 0 0-.168-.099l-5.65-3.22a.93.93 0 0 0-.928 0l-6.898 3.93V8.046a.083.083 0 0 1 .034-.072l5.712-3.251a5.375 5.375 0 0 1 5.698.241 5.262 5.262 0 0 1 1.865 2.28c.39.92.506 1.93.335 2.913ZM9.631 15.009l-2.39-1.36a.083.083 0 0 1-.046-.065V7.075c.001-.997.29-1.973.832-2.814a5.297 5.297 0 0 1 2.231-1.935 5.382 5.382 0 0 1 5.659.72 4.89 4.89 0 0 0-.168.093l-5.65 3.22a.913.913 0 0 0-.465.793l-.003 7.857Zm1.297-2.76L14 10.5l3.072 1.75v3.5L14 17.499l-3.072-1.75v-3.5Z"
                fill="currentColor"
              ></path>
            </svg>
            <h2 className="font-semibold">OpenAI</h2>
          </button>
          <button
            className={clsx(
              selectedProvider === "azure" ? "bg-sky-100" : "bg-white",
              "flex items-center gap-2 border border-gray-300 rounded-lg py-2 px-4"
            )}
            onClick={() => setSelectedProvider("azure")}
          >
            <Image
              src="/assets/landing/azure.svg.png"
              alt={"Azure"}
              width={28}
              height={28}
              quality={100}
              className="bg-transparent rounded-lg"
            />
            <h2 className="font-semibold">Azure</h2>
          </button>

          <button
            className={clsx(
              selectedProvider === "anthropic" ? "bg-sky-100" : "bg-white",
              "flex items-center gap-2 border border-gray-300 rounded-lg py-2 px-4"
            )}
            onClick={() => setSelectedProvider("anthropic")}
          >
            <Image
              src="/assets/home/providers/anthropic.jpeg"
              alt={"Anthropic"}
              width={28}
              height={28}
              quality={100}
              className="bg-transparent rounded-xl"
            />
            <h2 className="font-semibold">Anthropic</h2>
          </button>
          <Link
            className={clsx(
              "bg-white",
              "flex items-center gap-2 border border-gray-300 rounded-lg py-2 px-4"
            )}
            href="https://docs.helicone.ai/getting-started/integration-method/gateway"
            target="_blank"
            rel="noreferrer noopener"
          >
            <div className="flex w-full">
              <div className="relative flex items-center w-16 h-4">
                <Image
                  src="/assets/home/providers/lemonfox.png"
                  alt={"Anthropic"}
                  width={28}
                  height={28}
                  quality={100}
                  className="bg-transparent absolute left-0 z-40 rounded-xl"
                />
                <Image
                  src="/assets/home/providers/llama2.png"
                  alt={"Anthropic"}
                  width={28}
                  height={28}
                  quality={100}
                  className="bg-transparent absolute left-4 z-30 rounded-xl"
                />
                <Image
                  src="/assets/home/providers/anyscale.jpeg"
                  alt={"Anthropic"}
                  width={28}
                  height={28}
                  quality={100}
                  className="bg-transparent absolute left-8 z-20 rounded-xl"
                />
              </div>
            </div>
            <h2 className="font-semibold w-fit text-nowrap">
              Explore our docs
            </h2>
          </Link>
        </div>
        <div className="mt-8">{renderProviderObject[selectedProvider]}</div>
      </div>
      <div className="flex items-center justify-between p-4 sticky bottom-0 bg-gray-50 z-10">
        <Button variant={"secondary"} size={"sm"} onClick={previousStep}>
          Back
        </Button>
        <Button
          variant={"default"}
          size={"sm"}
          onClick={() => {
            nextStep();
          }}
        >
          Learn more about features and tooling
        </Button>
      </div>
    </div>
  );
};

export default Integrations;
