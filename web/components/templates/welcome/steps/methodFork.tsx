import { CheckCircleIcon, MinusCircleIcon } from "@heroicons/react/20/solid";
import { useEffect, useState } from "react";
import { clsx } from "../../../shared/clsx";

export interface Providers {
  openai: "openai";
  anthropic: "anthropic";
}

export interface IntegrationMethods {
  proxy: "proxy";
  async: "async";
}
interface MethodForkProps {
  nextStep: (
    provider: keyof Providers,
    integration: keyof IntegrationMethods
  ) => void;
  currentProvider?: keyof Providers;
  currentIntegration?: keyof IntegrationMethods;
}

const PROXY_FEATURES = [
  "Easy Setup",
  "Custom Rate Limiting",
  "Bucket Caching",
  "Request Retries",
];

const ASYNC_FEATURES = ["Not on critical path", "0 Propagation Delay"];

const MethodFork = (props: MethodForkProps) => {
  const { nextStep, currentProvider, currentIntegration } = props;

  const [provider, setProvider] = useState<keyof Providers | undefined>(
    currentProvider || undefined
  ); // ["openai", "anthropic"
  const [method, setMethod] = useState<keyof IntegrationMethods | undefined>(
    currentIntegration || undefined
  ); // ["proxy", "async"]
  const [loaded, setLoaded] = useState(false);

  // if the provider changes, method should be set to undefined. write this for me
  useEffect(() => {
    if (provider !== undefined) {
      setMethod(undefined);
    }
  }, [provider]);

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
        "flex flex-col items-center text-center w-full px-2 justify-center"
      )}
    >
      <div className="w-full">
        <p className="text-xl md:text-4xl font-semibold">Choose Provider</p>
        <div className="flex flex-col w-full md:flex-row gap-8 mt-8 justify-center">
          <button
            onClick={() => {
              setProvider("openai");
            }}
            className={clsx(
              provider === "openai" && "bg-gray-300",
              "hover:bg-gray-300 hover:cursor-pointer h-full w-full md:w-64 items-center rounded-lg border border-gray-500 shadow-lg p-4 flex flex-col gap-2"
            )}
          >
            <p className="text-gray-900 font-semibold text-xl text-center">
              OpenAI
            </p>
          </button>
          <button
            onClick={() => {
              setProvider("anthropic");
            }}
            className={clsx(
              provider === "anthropic" && "bg-gray-300",
              "hover:bg-gray-300 hover:cursor-pointer h-full w-full md:w-64 items-center rounded-lg border border-gray-500 shadow-lg p-4 flex flex-col gap-2"
            )}
          >
            <p className="text-gray-900 font-semibold text-xl">Anthropic</p>
          </button>
        </div>
      </div>

      <div
        className={`flex flex-col w-full transition-all ease-in-out duration-1000 ${
          provider !== undefined ? "opacity-100" : "opacity-0"
        }`}
      >
        <p className="text-xl md:text-4xl font-semibold mt-16">
          Integration Method
        </p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 mt-8">
          <button
            onClick={() => {
              if (provider === undefined) {
                return;
              }
              nextStep(provider, "proxy");
            }}
            className={clsx(
              method === "proxy" && "bg-gray-300",
              "relative hover:bg-gray-300 hover:cursor-pointer h-full md:min-h-[15rem] pb-4 md:pb-16 w-full md:w-64 rounded-lg border border-gray-500 shadow-lg p-4 flex flex-col gap-2"
            )}
          >
            <p className="text-gray-900 font-semibold text-xl w-full">
              Proxy <span className="text-sm text-gray-600">(Recommended)</span>
            </p>
            <ul className="hidden md:block text-left text-md leading-6 text-gray-600">
              {PROXY_FEATURES.map((feature, idx) => (
                <li
                  key={idx}
                  className="text-gray-700 mt-3 flex gap-x-3 items-center"
                >
                  <CheckCircleIcon
                    className={clsx("text-green-600", "h-6 w-5 flex-none")}
                    aria-hidden="true"
                  />
                  {feature}
                </li>
              ))}
            </ul>
          </button>
          {provider !== "anthropic" && (
            <button
              onClick={() => {
                if (provider === undefined) {
                  return;
                }
                nextStep(provider, "async");
              }}
              className={clsx(
                method === "async" && "bg-gray-300",
                "relative hover:bg-gray-300 hover:cursor-pointer h-full md:min-h-[15rem] pb-4 md:pb-16 w-full md:w-64 rounded-lg border border-gray-500 shadow-lg p-4 flex flex-col gap-2"
              )}
            >
              <p className="text-gray-900 font-semibold text-xl w-full">
                Async
              </p>
              <ul className="hidden md:block text-left text-md leading-6 text-gray-600">
                {ASYNC_FEATURES.map((feature, idx) => (
                  <li
                    key={idx}
                    className="text-gray-700 mt-3 flex gap-x-3 items-center"
                  >
                    <CheckCircleIcon
                      className={clsx("text-green-600", "h-6 w-5 flex-none")}
                      aria-hidden="true"
                    />
                    {feature}
                  </li>
                ))}
                <li className="text-gray-700 mt-3 flex gap-x-3 items-center">
                  <MinusCircleIcon
                    className={clsx("text-gray-600", "h-6 w-5 flex-none")}
                    aria-hidden="true"
                  />
                  Requires Package
                </li>
              </ul>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MethodFork;
