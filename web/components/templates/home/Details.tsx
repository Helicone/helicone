import {
  CloudArrowUpIcon,
  ForwardIcon,
  LockClosedIcon,
  ServerIcon,
} from "@heroicons/react/20/solid";
import {
  ChartBarIcon,
  MagnifyingGlassIcon,
  Square3Stack3DIcon,
} from "@heroicons/react/24/solid";
import { useState } from "react";
import { clsx } from "../../shared/clsx";

const features = [
  {
    name: "Seamless integration.",
    description:
      "Our proxy solution delivers instant analytics on-top of your GPT-3 requests with less than a scratch to your latency.",
    icon: Square3Stack3DIcon,
  },
  {
    name: "Meaningful insights.",
    description:
      "Filter your logs by user or by prompt to understand what is driving your costs and usage. Easily export your data to the rest of your workflow.",
    icon: ChartBarIcon,
  },
  {
    name: "Real-time monitoring.",
    description:
      "Track your key metrics from today, not tomorrow. With Valyr you can stay in control of costs with real-time tracking. Make informed updates to your models with actionable insights.",
    icon: ForwardIcon,
  },
];

export default function Details() {
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
            <div className="flex flex-row gap-2">
              <p className="text-red-500">import </p>
              <p className="text-blue-300">{`{`} </p>
              <p className="text-gray-300">Configuration, OpenAIApi </p>
              <p className="text-blue-300">{`}`} </p>
              <p className="text-red-500">from </p>
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
              <div className="flex flex-row gap-0 pl-4 bg-green-900">
                <p className="text-green-700 -ml-3 pr-1">+</p>
                <p className="text-gray-300">basePath: process.env.</p>
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
    <div className="overflow-hidden bg-white py-24 sm:py-32">
      <div className="mx-auto md:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-y-16 gap-x-8 sm:gap-y-20 lg:grid-cols-2 lg:items-start">
          <div className="px-6 md:px-0 lg:pt-4 lg:pr-4">
            <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-lg">
              <h2 className="text-lg font-semibold leading-8 tracking-tight text-sky-600">
                One line of code
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-black sm:text-4xl">
                Let us handle the analytics.
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-500">
                Monitoring your GPT-3 usage and costs shouldn&apos;t be a
                hassle. With Helicone, you can focus on building your product,
                not building and maintaining your own analytics solution for
                GPT-3.
              </p>
              <dl className="mt-10 max-w-xl space-y-8 text-base leading-7 text-gray-500 lg:max-w-none">
                {features.map((feature) => (
                  <div key={feature.name} className="relative pl-9">
                    <dt className="inline font-bold text-black">
                      <feature.icon
                        className="absolute top-1 left-1 h-5 w-5 text-sky-600"
                        aria-hidden="true"
                      />
                      {feature.name}
                    </dt>{" "}
                    <dd className="inline">{feature.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          <div className="sm:px-6 lg:px-0 mt-0 sm:mt-8 hidden sm:flex">
            <div className="relative isolate overflow-hidden bg-sky-500 px-6 pt-8 sm:mx-auto sm:max-w-2xl sm:rounded-3xl sm:pt-16 sm:pl-16 sm:pr-0 lg:mx-0 lg:max-w-none">
              <div
                className="absolute -inset-y-px -left-3 -z-10 w-full origin-bottom-left skew-x-[-30deg] bg-sky-100 opacity-20 ring-1 ring-inset ring-white"
                aria-hidden="true"
              />
              <div className="mx-auto max-w-2xl sm:mx-0 sm:max-w-none">
                <div className="w-screen overflow-hidden rounded-tl-xl bg-gray-900 ring-1 ring-white/10">
                  <div className="flex bg-gray-800/40 ring-1 ring-white/5">
                    <div className="-mb-px flex text-sm font-medium leading-6 text-gray-400">
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
                  <div className="px-6 pt-6 pb-14 h-96 flex flex-col gap-4 font-mono text-sm">
                    {codeSnippet()}
                  </div>
                </div>
              </div>
              <div
                className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/10 sm:rounded-3xl"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
