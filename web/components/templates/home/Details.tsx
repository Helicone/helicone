/* eslint-disable @next/next/no-img-element */
import {
  CloudArrowUpIcon,
  LockClosedIcon,
  ServerIcon,
} from "@heroicons/react/20/solid";
import { useState } from "react";
import { clsx } from "../../shared/clsx";

const features = [
  {
    name: "dashboard",
    label: "Your Dashboard.",
    description:
      "Get an insightful overview of your application and its performance. See how your users are interacting with your app, and how your app is performing.",
    icon: CloudArrowUpIcon,
  },
  {
    name: "requests",
    label: "View Requests.",
    description:
      "See all of your requests in one place. Filter by date, endpoint, and more. See the request body, response body, response time, and much more.",
    icon: LockClosedIcon,
  },
  {
    name: "model",
    label: "Model Metrics.",
    description:
      "Ever wonder how much you're spending on each model and its efficiency? See how much you're spending on each model so you can optimize your usage.",
    icon: ServerIcon,
  },
];

type DetailViews = "dashboard" | "requests" | "model";

export default function Details() {
  const [view, setView] = useState<DetailViews>("dashboard");

  return (
    <div className="overflow-hidden bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl md:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-y-16 gap-x-8 sm:gap-y-20 lg:grid-cols-2 lg:items-start">
          <div className="px-6 lg:px-0 lg:pt-4 lg:pr-4">
            <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-lg">
              <h2 className="text-lg font-semibold leading-8 tracking-tight text-indigo-600">
                One Line of Code
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Let us handle the analytics.
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Monitoring your GPT-3 usage and costs shouldn&apos;t be a
                hassle. With Helicone, you can focus on building your product,
                not building and maintaining your own analytics solution for
                GPT-3.
              </p>
              <dl className="mt-10 max-w-xl space-y-8 text-base leading-7 text-gray-600 lg:max-w-none">
                {features.map((feature) => (
                  <button
                    key={feature.name}
                    onClick={() => setView(feature.name as DetailViews)}
                    className={clsx(
                      view === feature.name
                        ? "border border-gray-500 shadow-sm"
                        : "border border-dashed border-gray-300 shadow-sm",
                      "text-left align-left relative rounded-md p-4 hover:scale-105 transition ease-in-out delay-150 duration-300 hover:cursor-pointer"
                    )}
                  >
                    <dt className="inline font-semibold text-gray-900">
                      {/* <feature.icon
                        className="relative top-1 left-1 h-5 w-5 text-indigo-600"
                        aria-hidden="true"
                      /> */}
                      {feature.label}
                    </dt>{" "}
                    <dd className="inline">{feature.description}</dd>
                  </button>
                ))}
              </dl>
            </div>
          </div>
          <div className="sm:px-6 lg:px-0">
            <div className="relative isolate overflow-hidden bg-purple-700 px-6 pt-8 sm:mx-auto sm:max-w-2xl sm:rounded-3xl sm:pt-16 sm:pl-16 sm:pr-0 lg:mx-0 lg:max-w-none">
              <div
                className="absolute -inset-y-px -left-3 -z-10 w-full origin-bottom-left skew-x-[-30deg] bg-indigo-100 opacity-20 ring-1 ring-inset ring-white"
                aria-hidden="true"
              />
              <div className="mx-auto max-w-2xl sm:mx-0 sm:max-w-none">
                <img
                  src="https://tailwindui.com/img/component-images/project-app-screenshot.png"
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
}
