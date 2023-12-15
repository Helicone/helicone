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
import { useRouter } from "next/router";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { DEMO_EMAIL } from "../../../lib/constants";

import { useEffect, useRef, useState } from "react";
import {
  ArrowPathIcon,
  BanknotesIcon,
  CloudArrowDownIcon,
  CloudArrowUpIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { clsx } from "../../shared/clsx";
import Link from "next/link";
import {
  ChartPieIcon,
  CloudIcon,
  CodeBracketIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";
import CodeSnippet from "./codeSnippet";
import Footer from "../../shared/layout/footer";
import NavBarV2 from "../../shared/layout/navbar/navBarV2";
import ManageHostedButton from "./manageHostedButton";
import ContactForm from "../../shared/contactForm";
import Image from "next/image";
import { CheckCircleIcon } from "@heroicons/react/20/solid";

const faqs = [
  {
    question: "How does Helicone work under the hood?",
    answer:
      "Our recommended integration is via a proxy, but we also support an async logging integration. We log the request and response payloads, and use that to build a user-level view of your LLM usage.",
  },
  {
    question: "What is the latency impact?",
    answer:
      "We know latency is a huge concern for your LLM-powered application, so we use Cloudflare Workers to ensure the latency impact is negligible. You can read more about our architecture here.",
  },
  {
    question: "I do not want to use a proxy. What are my options?",
    answer:
      "We have an async logging integration for users that do not want to use a proxy. We also provide a self-hosted version of our proxy for users that want to host it themselves.",
  },
  // More questions...
];

interface HomePageProps {
  microsoftForStartups?: boolean;
}

export default function HomePage(props: HomePageProps) {
  const { microsoftForStartups = false } = props;
  const router = useRouter();
  const supabaseClient = useSupabaseClient();
  const user = useUser();
  const [demoLoading, setDemoLoading] = useState(false);
  if (!demoLoading && user?.email === DEMO_EMAIL) {
    supabaseClient.auth.signOut();
  }

  const observabilityDiv = useRef(null);
  const rateDiv = useRef(null);
  const bucketDiv = useRef(null);

  const [currentPanel, setCurrentPanel] = useState("observability");

  useEffect(() => {
    const observability = observabilityDiv.current;
    const rate = rateDiv.current;
    const bucket = bucketDiv.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setCurrentPanel(entry.target.id);
            return;
          }
        });
      },
      {
        threshold: 0,
      }
    );

    if (observability) {
      observer.observe(observability);
    }

    if (rate) {
      observer.observe(rate);
    }

    if (bucket) {
      observer.observe(bucket);
    }

    return () => {
      if (observability) {
        observer.unobserve(observability);
      }

      if (rate) {
        observer.unobserve(rate);
      }

      if (bucket) {
        observer.unobserve(bucket);
      }
    };
  }, []);

  return (
    <div className="flex-col w-full antialiased">
      <NavBarV2 />
      <div className="relative isolate overflow-hidden bg-white">
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-32  border-gray-300">
          <div className="mx-auto lg:mx-0 lg:max-w-xl lg:flex-shrink-0 lg:pt-0">
            <div className="">
              <a
                href="https://www.ycombinator.com/launches/I73-helicone-open-source-observability-platform-for-generative-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex space-x-6"
              >
                <span className="rounded-full bg-orange-600/10 px-3 py-1 text-sm font-semibold leading-6 text-orange-600 ring-1 ring-inset ring-orange-600/10">
                  Backed by Y Combinator
                </span>
              </a>
            </div>
            <h1 className="mt-8 sm:mt-16 lg:mt-8 leading-tight lg:leading-tight font-bold tracking-tight text-gray-800  text-5xl lg:text-6xl antialiased">
              Open-Source{" "}
              <span className="bg-gradient-to-r from-sky-500 via-pink-500 to-violet-500 bg-[length:100%_4px] sm:bg-[length:100%_6px] pb-1 sm:pb-1.5 bg-no-repeat bg-bottom">
                Monitoring
              </span>{" "}
              <p>for Generative AI</p>
            </h1>

            <p className="mt-6 text-lg leading-8 max-w-md text-gray-700 antialiased">
              Thousands of users and organizations leverage Helicone to monitor
              their LLM applications. Instantly get insights into your latency,
              costs, and much more.
            </p>

            {microsoftForStartups ? (
              <div className="flex flex-row items-center mt-16 -ml-5">
                <div>
                  <Image
                    priority
                    src={"/assets/mfs.png"}
                    alt={"Helicone-mobile"}
                    width={300}
                    height={300}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-row gap-8 mt-10">
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-gray-800 font-semibold text-white text-sm rounded-lg"
                >
                  Get Started
                </Link>
                {demoLoading ? (
                  <button className="flex flex-row underline underline-offset-4 font-semibold text-gray-900 items-center text-sm">
                    <ArrowPathIcon className="w-4 h-4 mr-1.5 animate-spin" />
                    Logging In...
                  </button>
                ) : (
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
                    className="underline underline-offset-4 font-semibold text-gray-900 text-sm"
                  >
                    View Demo
                  </button>
                )}
              </div>
            )}
          </div>
          {microsoftForStartups ? (
            <ContactForm contactTag={"mfs"} buttonText={"Get 9 months free"} />
          ) : (
            <div className="relative mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-5 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-16">
              <div className="flex-none sm:max-w-5xl lg:max-w-none pl-24 pb-24">
                <div className="-m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-2 lg:rounded-2xl lg:p-2">
                  <Image
                    src="/assets/landing/preview.webp"
                    alt="App screenshot"
                    width={2720}
                    height={1844}
                    className="w-[55rem] rounded-lg shadow-2xl ring-1 ring-gray-900/10"
                  />
                </div>
              </div>
              <div className="flex-none sm:max-w-5xl lg:max-w-none absolute bottom-0">
                <div className="-m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-2 lg:rounded-2xl lg:p-2">
                  <Image
                    src="/assets/landing/request-preview.png"
                    alt="App screenshot"
                    width={556}
                    height={916}
                    className="w-[22.5rem] rounded-lg shadow-2xl ring-1 ring-gray-900/10"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        {microsoftForStartups && (
          <div className="mx-auto max-w-7xl px-6 lg:px-8 antialiased pb-24 sm:pb-32">
            <div className="bg-white mx-auto max-w-2xl rounded-3xl border border-gray-200 shadow-sm sm:mt-20 lg:mx-0 lg:flex lg:items-center lg:max-w-none">
              <div className="p-8 sm:p-10 lg:flex-auto">
                <h3 className="text-2xl font-bold tracking-tight text-gray-900">
                  What you get
                </h3>
                <p className="mt-6 text-base leading-7 text-gray-600">
                  We&apos;re excited for you to join our community. Enjoy a
                  dedicated Discord or Slack channel, an easy-to-use Helm chart,
                  priority on feature requests, and expert support. We{"'"}ve
                  got you covered for self-deployed instances and offer custom
                  ETL integrations.
                </p>
                <div className="mt-10 flex items-center gap-x-4">
                  <h4 className="flex-none text-sm font-semibold leading-6 text-indigo-600">
                    What&apos;s included
                  </h4>
                  <div className="h-px flex-auto bg-gray-100" />
                </div>
                <ul
                  role="list"
                  className="mt-6 grid grid-cols-1 gap-4 text-sm leading-6 text-gray-600 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-6"
                >
                  {[
                    "Monitoring and Dashboards",
                    "Custom Properties",
                    "Unlimited Requests",
                    "Bucket Caching",
                    "User Management and Rate Limiting",
                    "GraphQL API",
                    "Request Retries",
                    "Unlimited Organizations",
                    "Up to 2GB of storage",
                  ].map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <CheckCircleIcon
                        className="h-6 w-5 flex-none text-indigo-600"
                        aria-hidden="true"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="bg-gray-50">
        <div className="px-8 grid grid-cols-4 gap-16 h-full max-w-7xl mx-auto  border-gray-300  w-full items-center justify-center">
          <div className="col-span-4 md:col-span-2 flex flex-col space-y-8 py-32">
            <p className="text-5xl text-sky-500 tracking-wide font-semibold">
              Open Source
            </p>
            <p className="text-xl text-gray-700 font-medium leading-8">
              Open-Source is more than a choice—it&apos;s a commitment to
              user-centric development, community collaboration, and absolute
              transparency.
            </p>
            <div className="flex flex-row gap-8 items-center">
              <Link
                href="https://github.com/Helicone/helicone"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-800 font-semibold text-white rounded-lg"
              >
                Star us on GitHub
              </Link>
              <Link
                href="/roadmap"
                className="underline underline-offset-2 font-semibold text-gray-900"
              >
                View Roadmap
              </Link>
            </div>
          </div>
          <div className="flex flex-col col-span-2 md:col-span-1 h-full py-32 space-y-4">
            <div className="flex flex-col space-y-2">
              <CloudIcon className="h-8 w-8 inline text-sky-500" />
              <p className="text-gray-900 font-semibold text-xl">
                Cloud Solution
              </p>
            </div>
            <p className="text-gray-500">
              We offer a hosted cloud solution for users that want to get up and
              running quickly.
            </p>
            <div>
              <Link
                href="/pricing"
                className="underline underline-offset-2 font-semibold text-gray-900"
              >
                View Pricing
              </Link>
            </div>
          </div>
          <div className="flex flex-col col-span-2 md:col-span-1 h-full py-32 space-y-4">
            <div className="flex flex-col space-y-2">
              <CloudArrowUpIcon className="h-8 w-8 inline text-sky-500" />
              <p className="text-gray-900 font-semibold text-xl">
                Manage Hosted
              </p>
            </div>
            <p className="text-gray-500">
              Deploy Helicone on your own infrastructure to maintain full
              control over your data.
            </p>
            <div>
              <ManageHostedButton />
            </div>
          </div>
        </div>
      </div>
      <div className="bg-gray-100">
        <div className="px-8 pb-24 relative grid grid-cols-4 h-full max-w-7xl mx-auto  border-gray-300  w-full items-center justify-center">
          <div className="flex flex-col col-span-4 md:col-span-2 space-y-8 py-32 md:pr-32">
            <p className="text-lg text-sky-500 tracking-wide font-semibold">
              Real Time Metrics
            </p>
            <p className="text-5xl text-gray-900 font-semibold">
              Insights into your Usage and Performance
            </p>
            <div
              ref={observabilityDiv}
              id="observability"
              className="sr-only"
            />
            <p className="text-xl text-gray-700 font-normal leading-8">
              Building a Large-Language Model monitoring tool is time consuming
              and hard to scale. So we did it for you:
            </p>
            <ul className="flex flex-col space-y-4 list-disc ml-4 font-normal text-gray-700">
              <li>
                <p className="leading-7">
                  <span className="font-semibold text-gray-900 underline">
                    Monitor Spending:
                  </span>{" "}
                  Keep a close eye on your AI expenditure to control costs
                </p>
              </li>
              <li>
                <p className="leading-7">
                  <span className="font-semibold text-gray-900 underline">
                    Analyze Traffic Peaks:
                  </span>{" "}
                  Identify high-traffic periods to allocate resources more
                  efficiently
                </p>
              </li>
              <li>
                <p className="leading-7">
                  <span className="font-semibold text-gray-900 underline">
                    Track Latency Patterns:
                  </span>{" "}
                  Detect patterns in application speed and rectify slowdowns
                  proactively
                </p>
              </li>
            </ul>
          </div>
          <div className="flex-col hidden md:flex col-span-2 h-[85%] w-full flex-1 sticky top-[10%] pt-16 pb-8">
            <div className="h-full w-full relative">
              <div
                className={clsx(
                  currentPanel === "observability"
                    ? "bg-sky-50 border-sky-500 text-sky-500"
                    : "bg-gray-50 border-gray-300 text-gray-500",
                  "p-4 z-10 shadow-lg border-[1.5px] rounded-xl absolute top-0 flex items-center justify-center"
                )}
              >
                <ChartPieIcon className="h-8 w-8" />
              </div>
              <div
                className={clsx(
                  currentPanel === "rate"
                    ? "bg-pink-50 border-pink-500 text-pink-500"
                    : "bg-gray-50 border-gray-300 text-gray-500",
                  "p-4 z-10 shadow-lg border-[1.5px] rounded-xl absolute top-1/3 right-0 flex items-center justify-center"
                )}
              >
                <UserGroupIcon className="h-8 w-8" />
              </div>
              <div
                className={clsx(
                  currentPanel === "bucket"
                    ? "bg-purple-50 border-purple-500 text-purple-500"
                    : "bg-gray-50 border-gray-300 text-gray-500",
                  "p-4 z-10 shadow-lg border-[1.5px] rounded-xl absolute left-[10%] bottom-0 flex items-center justify-center"
                )}
              >
                <CodeBracketIcon className="h-8 w-8" />
              </div>
              <svg className="h-full w-full">
                {currentPanel === "observability" && (
                  <>
                    <line
                      x1="10%"
                      y1="5.5%"
                      x2="50%"
                      y2="5.5%"
                      stroke={"#0ea4e9"}
                      strokeWidth={1.25}
                    />
                    <line
                      x1="50%"
                      y1="5.5%"
                      x2="50%"
                      y2="20%"
                      stroke={"#0ea4e9"}
                      strokeWidth={1.25}
                    />
                  </>
                )}
                {currentPanel === "rate" && (
                  <>
                    <line
                      x1="95%"
                      y1="40%"
                      x2="95%"
                      y2="50%"
                      stroke="#ec489a"
                      strokeWidth={1.25}
                    />
                    <line
                      x1="95%"
                      y1="50%"
                      x2="85%"
                      y2="50%"
                      stroke="#ec489a"
                      strokeWidth={1.25}
                    />
                  </>
                )}
                {currentPanel === "bucket" && (
                  <>
                    <line
                      x1="15%"
                      y1="95%"
                      x2="50%"
                      y2="95%"
                      stroke="#a955f7"
                      strokeWidth={1.25}
                    />
                    <line
                      x1="50%"
                      y1="95%"
                      x2="50%"
                      y2="80%"
                      stroke="#a955f7"
                      strokeWidth={1.25}
                    />
                  </>
                )}
              </svg>
              <div
                className={clsx(
                  currentPanel === "observability" && "border-sky-500",
                  currentPanel === "rate" && "border-pink-500",
                  currentPanel === "bucket" && "border-purple-500",
                  "h-[70%] w-[70%] shadow-lg border-[1.5px] rounded-xl bg-white absolute top-0 bottom-0 left-0 right-0 m-auto p-4"
                )}
              >
                {currentPanel === "observability" && (
                  <div className="relative h-full">
                    <div className="p-6 w-56 bg-white border border-gray-300 rounded-lg space-y-2 absolute">
                      <div className="w-full flex flex-row items-center justify-between">
                        <div className="text-sm  text-gray-700">
                          Total Costs
                        </div>
                        {
                          <CurrencyDollarIcon
                            className="h-5 w-5"
                            aria-hidden="true"
                          />
                        }
                      </div>
                      <div className="text-2xl font-semibold">$432.24</div>
                    </div>
                    <div className="p-6 w-56 bg-white border border-gray-300 rounded-lg space-y-2 absolute top-[20%] right-0 z-10">
                      <div className="w-full flex flex-row items-center justify-between">
                        <div className="text-sm  text-gray-700">
                          Avg Latency / Req
                        </div>
                        {
                          <CloudArrowDownIcon
                            className="h-5 w-5"
                            aria-hidden="true"
                          />
                        }
                      </div>
                      <div className="text-2xl font-semibold">437.27 ms</div>
                    </div>
                    <div className="p-2 bottom-2 absolute rounded-lg border border-gray-300 mr-8">
                      <Image
                        src="/assets/landing/requests.png"
                        alt="requests-graph"
                      />
                    </div>
                  </div>
                )}
                {currentPanel === "rate" && (
                  <div className="h-full flex flex-col space-y-4">
                    <div className="w-full font-semibold text-gray-900 grid grid-cols-8 divide-x divide-gray-300 px-2 border-b border-gray-300 pb-1">
                      <p className="col-span-2">User</p>
                      <p className="col-span-3 pl-4">Total Cost</p>
                      <p className="col-span-3 pl-4">Avg Req / Day</p>
                    </div>
                    <ul className="space-y-4">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <li key={i}>
                          <ul className="w-full grid grid-cols-8 px-1">
                            <li className="bg-gray-400 rounded-lg h-6 w-12 col-span-2" />
                            <li className="bg-gray-400 rounded-lg h-6 w-16 col-span-3 ml-2" />
                            <li className="bg-gray-400 rounded-lg h-6 w-16 col-span-3 ml-2" />
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {currentPanel === "bucket" && (
                  <div className="relative h-full">
                    <div className="p-6 w-56 z-10 bg-white border border-gray-300 rounded-lg right-0 space-y-2 absolute">
                      <div className="w-full flex flex-row items-center justify-between">
                        <div className="text-sm  text-gray-700">
                          Total Saved
                        </div>
                        {
                          <BanknotesIcon
                            className="h-5 w-5"
                            aria-hidden="true"
                          />
                        }
                      </div>
                      <div className="text-2xl font-semibold">$146.21</div>
                    </div>
                    <div className="p-2 left-0 top-[15%] absolute rounded-lg border border-gray-300">
                      <Image
                        src="/assets/landing/piechart.png"
                        alt="pie-chart"
                        className="h-56 w-56"
                      />
                    </div>
                    <div className="p-4 h-40 w-56 bg-white border border-gray-300 rounded-lg flex flex-col space-y-4 absolute bottom-0 right-0">
                      <div className="flex flex-row space-x-2">
                        <div className="bg-gray-400 rounded-md h-4 w-12" />
                        <div className="bg-gray-400 rounded-md h-4 w-12" />
                        <div className="bg-gray-400 rounded-md h-4 w-8" />
                      </div>
                      <div className="flex flex-row space-x-2">
                        <div className="bg-gray-400 rounded-md h-4 w-8" />
                        <div className="bg-gray-400 rounded-md h-4 w-20" />
                      </div>
                      <div className="flex flex-row space-x-2">
                        <div className="bg-gray-400 rounded-md h-4 w-12" />
                        <div className="bg-gray-400 rounded-md h-4 w-20" />
                        <div className="bg-gray-400 rounded-md h-4 w-8" />
                      </div>
                      <div className="flex flex-row space-x-2">
                        <div className="bg-gray-400 rounded-md h-4 w-16" />
                        <div className="bg-gray-400 rounded-md h-4 w-24" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col col-span-4 md:col-span-2 space-y-8 py-32 md:pr-32">
            <p className="text-lg text-pink-500 tracking-wide font-semibold">
              User Management Tools
            </p>
            <p className="text-5xl text-gray-900 font-semibold">
              Easily manage your application&apos;s users
            </p>

            <p className="text-xl text-gray-700 font-normal leading-8">
              Our intuitive user management tools offer a hassle-free way to
              control access to your system.
            </p>
            <div ref={rateDiv} id="rate" className="sr-only" />
            <ul className="flex flex-col space-y-4 list-disc ml-4 font-normal text-gray-700">
              <li>
                <p className="leading-7">
                  <span className="font-semibold text-gray-900 underline">
                    User Rate Limiting:
                  </span>{" "}
                  Limit the number of requests per user to prevent abuse
                </p>
              </li>
              <li>
                <p className="leading-7">
                  <span className="font-semibold text-gray-900 underline">
                    User Metrics:
                  </span>{" "}
                  Identify power users and optimize your application for them
                </p>
              </li>
              <li>
                <p className="leading-7">
                  <span className="font-semibold text-gray-900 underline">
                    Request Retries:
                  </span>{" "}
                  Automatically retry failed requests to ensure users
                  aren&apos;t left in the dark
                </p>
              </li>
            </ul>
          </div>
          <div className="grid grid-cols-4 col-span-4 py-32 md:pr-32">
            <div className="col-span-4 md:col-span-2 space-y-8">
              <p className="text-lg text-purple-500 tracking-wide font-semibold">
                Tooling for LLMs
              </p>
              <p className="text-5xl text-gray-900 font-semibold">
                Tools to scale your LLM-powered application
              </p>

              <p className="text-xl text-gray-700 font-normal leading-8">
                Our toolkit provides an array of features to manage and control
                your AI applications.
              </p>
              <div ref={bucketDiv} id="bucket" className="sr-only" />
              <ul className="flex flex-col space-y-4 list-disc ml-4 font-normal text-gray-700">
                <li>
                  <p className="leading-7">
                    <span className="font-semibold text-gray-900 underline">
                      Bucket Cache:
                    </span>{" "}
                    Save money by caching and configuring responses
                  </p>
                </li>
                <li>
                  <p className="leading-7">
                    <span className="font-semibold text-gray-900 underline">
                      Custom Properties:
                    </span>{" "}
                    Tag requests to easily segment and analyze your traffic
                  </p>
                </li>
                <li>
                  <p className="leading-7">
                    <span className="font-semibold text-gray-900 underline">
                      Streaming Support:
                    </span>{" "}
                    Get analytics into streamed responses out of the box
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-[#0a2540] h-full">
        <div className="px-8 pb-16 relative grid grid-cols-4 h-full max-w-7xl mx-auto  border-gray-400  w-full items-center justify-center">
          <div className="col-span-4 md:col-span-2 flex flex-col space-y-12 py-32 md:pr-32">
            <p className="text-lg text-sky-400 tracking-wide font-semibold">
              Made By Developers, For Developers
            </p>
            <p className="text-5xl text-white font-semibold">
              Simple and Flexible Integration
            </p>
            <p className="text-xl text-gray-300 font-normal leading-8">
              Our solution is designed to seamlessly integrate with your
              existing setup:
            </p>
            <ul className="flex flex-col space-y-4 list-disc ml-4 font-normal text-gray-300">
              <li>
                <p className="leading-7">
                  <span className="font-semibold text-gray-100 underline">
                    Effortless Setup:
                  </span>{" "}
                  Get started with only 2 lines of code
                </p>
              </li>
              <li>
                <p className="leading-7">
                  <span className="font-semibold text-gray-100 underline">
                    Versatile Support:
                  </span>{" "}
                  Our platform smoothly integrates with your preferred tool
                </p>
              </li>
              <li>
                <p className="leading-7">
                  <span className="font-semibold text-gray-100 underline">
                    Package Variety:
                  </span>{" "}
                  Choose from a wide range of packages to import
                </p>
              </li>
            </ul>
            <div>
              <Link
                href="https://docs.helicone.ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-sky-400 font-semibold text-gray-900 rounded-lg"
              >
                Read Our Docs
              </Link>
            </div>
          </div>
          <div className="hidden md:flex flex-col col-span-4 md:col-span-2 h-full py-32 space-y-4">
            <CodeSnippet variant={"themed"} />
            <p className="text-center italic text-gray-500">
              Example Integration with OpenAI
            </p>
          </div>
        </div>
      </div>
      <div className="bg-violet-50">
        <div className="px-8 grid grid-cols-4 gap-24 h-full max-w-7xl mx-auto border-gray-300 w-full justify-center">
          <div className="col-span-4 md:col-span-2 flex flex-col space-y-8 py-32">
            <p className="text-5xl text-violet-500 tracking-wide font-semibold">
              Frequently Asked Questions
            </p>
            <p className="text-xl text-gray-700 font-medium leading-8">
              Can’t find the answer you’re looking for? Join our Discord server
              or contact us directly.
            </p>
            <div className="flex flex-row gap-8 items-center">
              <Link
                href="https://discord.gg/zsSTcH2qhG"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-800 font-semibold text-white rounded-lg"
              >
                Join Discord
              </Link>
              <Link
                href="mailto:sales@helicone.ai"
                className="underline underline-offset-2 font-semibold text-gray-900"
              >
                Contact Us
              </Link>
            </div>
          </div>
          <div className="col-span-4 md:col-span-2 flex flex-col space-y-8 py-32">
            <ul className="space-y-16">
              {faqs.map((faq, idx) => (
                <li key={idx}>
                  <p className="text-xl text-gray-900 font-bold leading-8">
                    {faq.question}
                  </p>
                  <p className="text-gray-700 mt-2 leading-7">{faq.answer}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
