/* eslint-disable @next/next/no-img-element */
/*
  This example requires some changes to your config:
  
  ```
  // tailwind.config.js
  module.exports = {
    // ...
    plugins: [
      // ...
      require('@tailwindcss/forms'),
    ],
  }
  ```
*/
import { StarIcon } from "@heroicons/react/20/solid";
import AdvancedAnalytics from "./AdvancedAnalytics";
import { useRouter } from "next/router";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { DEMO_EMAIL } from "../../../lib/constants";
import Details from "./detailsV2";
import BasePageV2 from "../../shared/layout/basePageV2";

import { useState } from "react";
import OnboardingButton from "../../shared/auth/onboardingButton";
import {
  ArrowPathIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { BaseUrlInstructions } from "../welcome/welcomePage";
import { clsx } from "../../shared/clsx";
import Link from "next/link";
import { Dialog } from "@headlessui/react";
import { useQuery } from "@tanstack/react-query";

const timeline = [
  {
    name: "Founded company",
    description:
      "After years of working as software engineers, we quit our jobs looking to build within the generative AI space.",
    date: "Jan 2023",
    dateTime: "2023-01",
  },
  {
    name: "Backed by YCombinator",
    description:
      "We were accepted into YCombinator's Winter 2023 batch and have been working closely with the YC partners.",
    date: "Jan 2023",
    dateTime: "2023-01",
  },
  {
    name: "Launched Helicone",
    description:
      "After building multiple LLM apps and struggling with the lack of good monitoring and observability tools, we decided to build Helicone.",
    date: "Feb 2022",
    dateTime: "2023-02",
  },
  {
    name: "5 million requests",
    description:
      "We reached 5 million requests in just over a months time, and we're just getting started.",
    date: "Mar 2023",
    dateTime: "2023-03",
  },
];

const testimonials = [
  [
    [
      {
        body: `Keeping costs under control was a huge issue 2-3 weeks ago but we are now profitable per user.
        We leveraged a mix of caching, model-swapping, fine-tuning, and product updates to get here
        @helicone_ai has been a godsend for LLM cost analytics, especially cost/user`,
        author: {
          name: "Daniel Habib",
          handle: "DannyHabibs",
          imageUrl: "/assets/daniel-habib.png",
        },
      },
    ],
    [
      {
        body: "My favourite of the new AI apps? @helicone_ai - Observability for @OpenAI is pretty bad. Hard to track bills and specific usage with native tools. I see Helicone as the next @datadoghq",
        author: {
          name: "John Ndege",
          handle: "johnndege",
          imageUrl: "/assets/john-ndege.png",
        },
      },
      // More testimonials...
    ],
  ],
  [
    [
      {
        body: `I'm now using Helicone and it's a major QoL improvement while deving on LLMs

        Add one line to your python/JS OpenAI project and get
        - input/output logging
        - user-level metrics
        - caching (soon)
        
        Also OSS 👏`,
        author: {
          name: "Jay Hack",
          handle: "mathemagic1an",
          imageUrl: "/assets/jay-hack.png",
        },
      },
      // More testimonials...
    ],
    [
      {
        body: `As an early-stage startup, speed is everything at Trelent. Helicone helps us quickly understand user behaviour when we're iterating with OpenAI, shorten our testing cycles.`,
        author: {
          name: "Calum Bird",
          handle: "calumbirdo",
          imageUrl: "/assets/calum-bird.png",
        },
      },
      // More testimonials...
    ],
  ],
];

export default function HomePage() {
  const router = useRouter();
  const supabaseClient = useSupabaseClient();
  const user = useUser();
  const [demoLoading, setDemoLoading] = useState(false);
  if (!demoLoading && user?.email === DEMO_EMAIL) {
    supabaseClient.auth.signOut();
  }
  const { data: globalMetrics } = useQuery({
    queryKey: ["global_metrics"],
    queryFn: async () => {
      const data = fetch("/api/global_metrics").then((res) => res.json());
      return data;
    },
  });

  return (
    <>
      <BasePageV2>
        <div className="relative isolate overflow-hidden bg-gray-50">
          <svg
            className="absolute inset-0 -z-10 h-full w-full stroke-gray-200 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id="0787a7c5-978c-4f66-83c7-11c213f99cb7"
                width={200}
                height={200}
                x="50%"
                y={-1}
                patternUnits="userSpaceOnUse"
              >
                <path d="M.5 200V.5H200" fill="none" />
              </pattern>
            </defs>
            <rect
              width="100%"
              height="100%"
              strokeWidth={0}
              fill="url(#0787a7c5-978c-4f66-83c7-11c213f99cb7)"
            />
          </svg>
          <div className="mx-auto max-w-7xl px-6 pt-10 pb-24 sm:pb-32 lg:flex lg:py-28 lg:px-8">
            <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0 lg:pt-8">
              <div className="mt-24 sm:mt-32 lg:mt-8">
                <div className="inline-flex space-x-6">
                  <span className="rounded-full bg-orange-600/10 px-3 py-1 text-sm font-semibold leading-6 text-orange-600 ring-1 ring-inset ring-orange-600/10">
                    Backed by YCombinator
                  </span>
                  <Link
                    href="https://github.com/Helicone/helicone"
                    className="sm:inline-flex hidden items-center space-x-2 text-sm font-medium leading-6 text-gray-600"
                  >
                    <span>We&apos;re Open-Source</span>
                    <ChevronRightIcon
                      className="h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </Link>
                </div>
              </div>
              <h1 className="mt-8 text-4xl font-bold tracking-tight text-gray-900 sm:text-7xl">
                Observability for LLM applications
              </h1>
              <p className="mt-6 text-xl leading-8 text-gray-600">
                Track usage, costs, and latency metrics with one line of code.
                We&apos;re an open-source observability platform that helps you
                better understand your GPT-3 application.
              </p>
              <div className="mt-10 flex items-center gap-x-4">
                <OnboardingButton variant="secondary" title={"Get Started"} />
                <button
                  onClick={() => {
                    setDemoLoading(true);
                    supabaseClient.auth.signOut().then(() => {
                      supabaseClient.auth
                        .signInWithPassword({
                          email: DEMO_EMAIL,
                          password: "valyrdemo",
                        })
                        .then((res) => {
                          router.push("/demo").then(() => {
                            setDemoLoading(false);
                          });
                        });
                    });
                  }}
                  className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold border border-gray-300 hover:bg-sky-50 text-gray-900 shadow-sm hover:text-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                >
                  {demoLoading ? (
                    <ArrowPathIcon className="h-5 w-5 inline animate-spin" />
                  ) : (
                    <p>View Demo</p>
                  )}
                </button>
              </div>
            </div>
            <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-32 lg:mt-0 lg:mr-0 lg:max-w-none lg:flex-none xl:ml-32">
              <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
                <div className="-m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4">
                  <img
                    src="/assets/test.png"
                    alt="App screenshot"
                    width={2432}
                    height={1442}
                    className="w-[76rem] rounded-md shadow-2xl ring-1 ring-gray-900/10"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* FEATURE */}
        <div className="bg-white py-24 sm:py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:mx-0">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Even wonder how much you spend on GPT-3? We do too.
              </h2>
              <p className="mt-6 text-base leading-7 text-gray-600">
                Creating an internal tool for observability and monitoring is
                difficult to build and even harder to maintain. And general
                logging tools like Mixpanel or Datadog aren&apos;t tailored
                enough for LLMs. Helicone is a platform built specifically for
                developers using LLMs.
              </p>
            </div>
            <div className="mx-auto mt-16 flex max-w-2xl flex-col gap-8 lg:mx-0 lg:mt-20 lg:max-w-none lg:flex-row lg:items-end">
              <div className="flex flex-col-reverse justify-between gap-x-16 gap-y-8 rounded-2xl bg-gray-100 p-8 sm:w-3/4 sm:max-w-md sm:flex-row-reverse sm:items-end lg:w-72 lg:max-w-none lg:flex-none lg:flex-col lg:items-start">
                <p className="flex-none text-3xl font-bold tracking-tight text-gray-900">
                  100
                </p>
                <div className="sm:w-80 sm:shrink lg:w-auto lg:flex-none">
                  <p className="text-lg font-semibold tracking-tight text-gray-900">
                    Stars on Github
                  </p>
                  <p className="mt-2 text-base leading-7 text-gray-600">
                    We provide cloud and self-hosting solutions
                  </p>
                </div>
              </div>
              <div className="flex flex-col-reverse justify-between gap-y-8 gap-x-16 rounded-2xl bg-gray-900 p-8 sm:flex-row-reverse sm:items-end lg:w-full lg:max-w-sm lg:flex-auto lg:flex-col lg:items-start lg:gap-y-44">
                <p className="flex-none text-3xl font-bold tracking-tight text-white">
                  {Math.floor(
                    (globalMetrics?.data[0].count ?? 5_700_000) / 100_000
                  ) / 10}{" "}
                  Million
                </p>
                <div className="sm:w-80 sm:shrink lg:w-auto lg:flex-none">
                  <p className="text-lg font-semibold tracking-tight text-white">
                    We&apos;re proud that our customers have made over{" "}
                    {Math.floor(
                      (globalMetrics?.data[0].count ?? 5_700_000) / 1_000_000
                    )}{" "}
                    million requests.
                  </p>
                  <p className="mt-2 text-base leading-7 text-gray-400">
                    We currently support all OpenAI models and have plans to add
                    other providers
                  </p>
                </div>
              </div>
              <div className="flex flex-col-reverse justify-between gap-y-8 gap-x-16 rounded-2xl bg-sky-600 p-8 sm:w-11/12 sm:max-w-xl sm:flex-row-reverse sm:items-end lg:w-full lg:max-w-none lg:flex-auto lg:flex-col lg:items-start lg:gap-y-28">
                <p className="flex-none text-3xl font-bold tracking-tight text-white">
                  &gt;200,000
                </p>
                <div className="sm:w-80 sm:shrink lg:w-auto lg:flex-none">
                  <p className="text-lg font-semibold tracking-tight text-white">
                    Requests per day
                  </p>
                  <p className="mt-2 text-base leading-7 text-indigo-200">
                    Every day our customers are getting value from Helicone.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* DetailsV2 */}
        <Details />
        {/* ONE LINE OF CODE */}
        <div className="relative isolate bg-white pt-24 pb-32 sm:pt-32">
          <div className="absolute inset-x-0 top-0 -z-10 flex transform-gpu overflow-hidden pt-32 opacity-25 blur-3xl sm:pt-40 xl:justify-end">
            <svg
              viewBox="0 0 1313 771"
              aria-hidden="true"
              className="ml-[-22rem] w-[82.0625rem] flex-none origin-top-right rotate-[30deg] xl:ml-0 xl:mr-[calc(50%-12rem)]"
            >
              <use href="#bc169a03-3518-42d4-ab1e-d3eadac65edc" />
            </svg>
          </div>
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-7xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Get integrated with only one line of code.
              </h2>
              <p className="mt-6 text-base leading-7 text-gray-600">
                Here are some testimonials from real users that have integrated
                Helicone into their apps.
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 grid-rows-1 gap-8 text-sm leading-6 text-gray-900 sm:mt-20 sm:grid-cols-2 xl:mx-0 xl:max-w-none xl:grid-flow-col xl:grid-cols-4">
              <figure className="col-span-1 sm:col-span-2 block sm:rounded-2xl xl:col-start-2 xl:row-end-1">
                <BaseUrlInstructions />
              </figure>
              {testimonials.map((columnGroup, columnGroupIdx) => (
                <div
                  key={columnGroupIdx}
                  className="space-y-8 xl:contents xl:space-y-0"
                >
                  {columnGroup.map((column, columnIdx) => (
                    <div
                      key={columnIdx}
                      className={clsx(
                        (columnGroupIdx === 0 && columnIdx === 0) ||
                          (columnGroupIdx === testimonials.length - 1 &&
                            columnIdx === columnGroup.length - 1)
                          ? "xl:row-span-2"
                          : "xl:row-start-1",
                        "space-y-8"
                      )}
                    >
                      {column.map((testimonial) => (
                        <figure
                          key={testimonial.author.handle}
                          className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-900/5"
                        >
                          <blockquote className="text-gray-900">
                            <p className="whitespace-pre-line">{`“${testimonial.body}”`}</p>
                          </blockquote>
                          <figcaption className="mt-6 flex items-center gap-x-4">
                            <img
                              className="h-10 w-10 rounded-full bg-gray-50 border border-gray-500"
                              src={testimonial.author.imageUrl}
                              alt=""
                            />
                            <div>
                              <div className="font-semibold">
                                {testimonial.author.name}
                              </div>
                              <div className="text-gray-600">{`@${testimonial.author.handle}`}</div>
                            </div>
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Open Source */}
        <div className="bg-gray-50 py-24 sm:py-32">
          <div className="flex flex-col sm:flex-row w-full justify-between mx-auto max-w-7xl px-6 lg:px-8 items-start sm:items-center space-y-6 sm:space-y-0">
            <div className="mx-auto max-w-2xl lg:mx-0">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Join our fast-growing open source community
              </h2>
              <p className="mt-6 text-base leading-7 text-gray-600">
                We&apos;ve been developer driven from the start, and we&apos;re
                committed to keeping it that way. We&apos;re always looking for
                new contributors to help us build the best open source developer
                tools.
              </p>
            </div>
            <div className="block space-x-4">
              <a
                href="https://discord.gg/zsSTcH2qhG"
                target="_blank"
                rel="noreferrer"
                className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold border border-gray-300 hover:bg-sky-50 text-gray-900 shadow-sm hover:text-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              >
                Join Discord
              </a>
              <a
                href="https://github.com/Helicone/helicone"
                target="_blank"
                rel="noreferrer"
                className="rounded-md bg-sky-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              >
                View Github
              </a>
            </div>
          </div>
          <div className="py-8 sm:py-16">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mx-auto grid max-w-2xl grid-cols-1 gap-8 overflow-hidden lg:mx-0 lg:max-w-none lg:grid-cols-4">
                {timeline.map((item) => (
                  <div key={item.name}>
                    <time
                      dateTime={item.dateTime}
                      className="flex items-center text-sm font-semibold leading-6 text-sky-600"
                    >
                      <svg
                        viewBox="0 0 4 4"
                        className="mr-4 h-1 w-1 flex-none"
                        aria-hidden="true"
                      >
                        <circle cx={2} cy={2} r={2} fill="currentColor" />
                      </svg>
                      {item.date}
                      <div
                        className="absolute -ml-2 h-px w-screen -translate-x-full bg-gray-900/10 sm:-ml-4 lg:static lg:ml-8 lg:-mr-6 lg:w-auto lg:flex-auto lg:translate-x-0"
                        aria-hidden="true"
                      />
                    </time>
                    <p className="mt-6 text-lg font-semibold leading-8 tracking-tight text-gray-900">
                      {item.name}
                    </p>
                    <p className="mt-1 text-base leading-7 text-gray-600">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </BasePageV2>
    </>
  );
}
