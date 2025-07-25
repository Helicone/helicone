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
    integration: keyof IntegrationMethods,
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
    currentProvider || undefined,
  ); // ["openai", "anthropic"
  const [method, setMethod] = useState<keyof IntegrationMethods | undefined>(
    currentIntegration || undefined,
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
        "flex w-full flex-col items-center justify-center px-2 text-center",
      )}
    >
      <div className="w-full">
        <p className="text-xl font-semibold md:text-4xl">Choose Provider</p>
        <div className="mt-8 flex w-full flex-col justify-center gap-8 md:flex-row">
          <button
            onClick={() => {
              setProvider("openai");
            }}
            className={clsx(
              provider === "openai" && "bg-gray-300",
              "flex h-full w-full flex-col items-center gap-2 rounded-lg border border-gray-500 p-4 shadow-lg hover:cursor-pointer hover:bg-gray-300 md:w-64",
            )}
          >
            <p className="text-center text-xl font-semibold text-gray-900">
              OpenAI
            </p>
          </button>
          <button
            onClick={() => {
              setProvider("anthropic");
            }}
            className={clsx(
              provider === "anthropic" && "bg-gray-300",
              "flex h-full w-full flex-col items-center gap-2 rounded-lg border border-gray-500 p-4 shadow-lg hover:cursor-pointer hover:bg-gray-300 md:w-64",
            )}
          >
            <p className="text-xl font-semibold text-gray-900">Anthropic</p>
          </button>
        </div>
      </div>

      <div
        className={`flex w-full flex-col transition-all duration-1000 ease-in-out ${
          provider !== undefined ? "opacity-100" : "opacity-0"
        }`}
      >
        <p className="mt-16 text-xl font-semibold md:text-4xl">
          Integration Method
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-8 md:flex-row">
          <button
            onClick={() => {
              if (provider === undefined) {
                return;
              }
              nextStep(provider, "proxy");
            }}
            className={clsx(
              method === "proxy" && "bg-gray-300",
              "relative flex h-full w-full flex-col gap-2 rounded-lg border border-gray-500 p-4 pb-4 shadow-lg hover:cursor-pointer hover:bg-gray-300 md:min-h-[15rem] md:w-64 md:pb-16",
            )}
          >
            <p className="w-full text-xl font-semibold text-gray-900">
              Proxy <span className="text-sm text-gray-600">(Recommended)</span>
            </p>
            <ul className="text-md hidden text-left leading-6 text-gray-600 md:block">
              {PROXY_FEATURES.map((feature, idx) => (
                <li
                  key={idx}
                  className="mt-3 flex items-center gap-x-3 text-gray-700"
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
                "relative flex h-full w-full flex-col gap-2 rounded-lg border border-gray-500 p-4 pb-4 shadow-lg hover:cursor-pointer hover:bg-gray-300 md:min-h-[15rem] md:w-64 md:pb-16",
              )}
            >
              <p className="w-full text-xl font-semibold text-gray-900">
                Async
              </p>
              <ul className="text-md hidden text-left leading-6 text-gray-600 md:block">
                {ASYNC_FEATURES.map((feature, idx) => (
                  <li
                    key={idx}
                    className="mt-3 flex items-center gap-x-3 text-gray-700"
                  >
                    <CheckCircleIcon
                      className={clsx("text-green-600", "h-6 w-5 flex-none")}
                      aria-hidden="true"
                    />
                    {feature}
                  </li>
                ))}
                <li className="mt-3 flex items-center gap-x-3 text-gray-700">
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
