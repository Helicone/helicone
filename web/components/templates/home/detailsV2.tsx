/* eslint-disable @next/next/no-img-element */
import {
  CloudArrowUpIcon,
  LockClosedIcon,
  ServerIcon,
} from "@heroicons/react/20/solid";
import { useState } from "react";
import { clsx } from "../../shared/clsx";
import Image from "next/image";

const features: FeatureDetails[] = [
  {
    name: "dashboard",
    label: "Key Metrics.",
    description:
      "Get an overview of your application with an in-built dashboard, tailor made for generative AI applications.",
    icon: CloudArrowUpIcon,
    src: "/assets/landing/dashboard-preview.webp",
  },
  {
    name: "requests",
    label: "View Requests.",
    description:
      "View all of your requests in one place. Filter by time, users, and custom properties.",
    icon: LockClosedIcon,
    src: "assets/landing/requests-preview.webp",
  },
  {
    name: "model",
    label: "Optimize Spend.",
    description:
      "Track spending on each model, user, or conversation. Use this data to optimize your API usage and reduce costs.",
    icon: ServerIcon,
    src: "assets/landing/models-preview.webp",
  },
];

type FeatureDetails = {
  name: string;
  label: string;
  description: string;
  icon: any;
  src: string;
};

const Details = () => {
  const [selected, setSelected] = useState<FeatureDetails>(features[0]);

  return (
    <div className="overflow-hidden bg-gray-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl md:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-y-16 gap-x-8 sm:gap-y-20 lg:grid-cols-2 lg:items-start">
          <div className="px-6 lg:px-0 lg:pt-4 lg:pr-4">
            <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-lg space-y-4 sm:space-y-8">
              <p className="text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Stay on top of your costs, usage, and latency
              </p>
              <p className="text-lg sm:text-xl leading-8 text-gray-600">
                Integrate models like GPT-4 with Helicone to track API requests
                and visualize results.
              </p>
              <dl className="max-w-xl space-y-8 text-base leading-7 text-gray-600 lg:max-w-none">
                {features.map((feature) => (
                  <div key={feature.name}>
                    <button
                      key={`desktop-${feature.name}`}
                      onClick={() => setSelected(feature)}
                      className={clsx(
                        selected.name === feature.name
                          ? "border border-gray-500 shadow-sm"
                          : "border border-dashed border-gray-300 shadow-sm",
                        "hidden sm:block text-left align-left relative rounded-md p-4 hover:scale-105 transition ease-in-out delay-150 duration-300 hover:cursor-pointer"
                      )}
                    >
                      <dt className="inline font-semibold text-gray-900">
                        {feature.label}
                      </dt>{" "}
                      <dd className="inline">{feature.description}</dd>
                    </button>
                    <button
                      key={`mobile-${feature.name}`}
                      onClick={() => setSelected(feature)}
                      className={clsx(
                        "block sm:hidden border border-gray-500 shadow-sm text-left align-left relative rounded-md p-4 hover:scale-105 transition ease-in-out delay-150 duration-300 hover:cursor-pointer"
                      )}
                    >
                      <dt className="inline font-semibold text-gray-900">
                        {feature.label}
                      </dt>{" "}
                      <dd className="inline">{feature.description}</dd>
                    </button>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          <div className="sm:px-6 lg:px-0 hidden sm:flex">
            <div className="relative isolate overflow-hidden bg-gradient-to-r from-sky-600 to-indigo-500 px-6 pt-8 sm:mx-auto sm:max-w-2xl sm:rounded-3xl sm:pt-16 sm:pl-16 sm:pr-0 lg:mx-0 lg:max-w-none">
              <div
                className="absolute -inset-y-px -left-3 -z-10 w-full origin-bottom-left skew-x-[-30deg] bg-indigo-100 opacity-20 ring-1 ring-inset ring-white"
                aria-hidden="true"
              />
              <div className="mx-auto max-w-2xl sm:mx-0 sm:max-w-none">
                <Image
                  src={selected.src}
                  alt="Product screenshot"
                  width={2432}
                  height={1442}
                  className="-mb-12 w-[57rem] max-w-none rounded-tl-xl bg-gray-800 ring-1 ring-white/10"
                />
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
};

export default Details;
