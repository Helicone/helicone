import { useState } from "react";
import { Disclosure } from "@headlessui/react";
import {
  ArrowPathIcon,
  BellAlertIcon,
  CircleStackIcon,
  CodeBracketIcon,
  HandThumbUpIcon,
  LockClosedIcon,
  MinusSmallIcon,
  PlusSmallIcon,
  RectangleStackIcon,
  TagIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon } from "@heroicons/react/20/solid";
import NavBarV2 from "../../layout/navbar/navBarV2";
import Footer from "../../layout/footer";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { DEMO_EMAIL } from "../../../lib/constants";
import Image from "next/image";
import { clsx } from "../../shared/clsx";
import Globe from "./globe";
import { Database } from "../../../supabase/database.types";

const features: {
  title: string;
  description: string;
  icon: React.ForwardRefExoticComponent<
    React.SVGProps<SVGSVGElement> & {
      title?: string | undefined;
      titleId?: string | undefined;
    }
  >;
  color: string;
}[] = [
  {
    title: "Custom Properties",
    description: "Easily segment requests.",
    icon: TagIcon,
    color: "text-purple-700",
  },
  {
    title: "Caching",
    description: "Save time and money.",
    icon: CircleStackIcon,
    color: "text-red-700",
  },
  {
    title: "Rate Limiting",
    description: "Protect your models from abuse.",
    icon: UserIcon,
    color: "text-blue-700",
  },
  {
    title: "Retries",
    description: "Retry failed or rate-limited requests.",
    icon: ArrowPathIcon,
    color: "text-yellow-700",
  },
  {
    title: "Feedback",
    description: "Identify good and bad requests.",
    icon: HandThumbUpIcon,
    color: "text-green-700",
  },
  {
    title: "Vault",
    description: "Securely map your provider keys.",
    icon: LockClosedIcon,
    color: "text-indigo-700",
  },
  {
    title: "Jobs",
    description: "Visualize chains of requests.",
    icon: RectangleStackIcon,
    color: "text-pink-700",
  },
  {
    title: "GraphQL",
    description: "ETL your data to your favorite apps.",
    icon: CodeBracketIcon,
    color: "text-sky-700",
  },
  {
    title: "Alerts",
    description: "Get notified on important events.",
    icon: BellAlertIcon,
    color: "text-rose-700",
  },
];

const faqs = [
  {
    question: "Is their a latency impact to my requests with Helicone's Proxy?",
    answer:
      "Helicone leverages Cloudflare’s global network of servers as proxies for efficient web traffic routing. Cloudflare workers maintain extremely low latency through their worldwide distribution. This results in a fast and reliable proxy for your LLM requests with less than a fraction of a millisecond of latency impact.",
  },
  {
    question: "Do you offer a self-hosted or manage-hosted solution?",
    answer:
      "Our recommended solution is to use our cloud service, but we do offer a dedicated manage-hosted solution for enterprise customers. Please contact us at sales@helicone.ai for more information.",
  },
  {
    question: "I do not want to use the proxy, can I still use Helicone?",
    answer:
      "Yes, you can use Helicone without the proxy. We have packages for Python and Node.js that you can use to send data to Helicone. Visit our documentation page to learn more.",
  },
  // More questions...
];

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function Example() {
  const [demoLoading, setDemoLoading] = useState(false);

  const router = useRouter();
  const user = useUser();

  const supabaseClient = useSupabaseClient<Database>();

  if (!demoLoading && user?.email === DEMO_EMAIL) {
    supabaseClient.auth.signOut();
  }

  return (
    <div className="bg-white">
      <div className="flex items-center gap-x-6 bg-black hover:bg-gray-900 px-6 py-2.5 sm:px-3.5 sm:before:flex-1">
        <p className="text-sm leading-6 text-white">
          <Link href="/features/fine-tuning">
            <strong className="font-semibold">Launch: Fine-Tuning</strong>
            <svg
              viewBox="0 0 2 2"
              className="mx-2 inline h-0.5 w-0.5 fill-current"
              aria-hidden="true"
            >
              <circle cx={1} cy={1} r={1} />
            </svg>
            Reduce your costs and improve your applications performance{" "}
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </p>
        <div className="flex flex-1 justify-end"></div>
      </div>
      <NavBarV2 />

      <div className="relative isolate">
        <svg
          className="absolute inset-0 -z-10 h-full w-full stroke-gray-200 [mask-image:radial-gradient(100%_60%_at_top_center,white,transparent)]"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="abc"
              width={25}
              height={25}
              x="50%"
              y={-1}
              patternUnits="userSpaceOnUse"
            >
              <path d="M25 200V.5M.5 .5H200" fill="none" />
            </pattern>
            <defs>
              <pattern
                id="123"
                width="12.5"
                height="12.5"
                patternUnits="userSpaceOnUse"
              >
                <path d="M12.5 0V12.5M0 12.5H12.5" fill="none" />
              </pattern>
            </defs>
          </defs>
          <rect width="100%" height="100%" strokeWidth={0} fill="url(#abc)" />
        </svg>
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-36 flex flex-col space-y-4 md:space-y-8 items-center justify-center text-center lg:gap-x-10 lg:px-8 antialiased">
          <h1 className="text-4xl sm:text-6xl font-semibold leading-tight sm:leading-relaxed tracking-tight max-w-6xl">
            The{" "}
            <span className="md:border border-sky-600 border-dashed text-sky-600 md:py-1.5 md:px-3">
              trusted
            </span>{" "}
            Generative AI platform for modern{" "}
            <span className="md:border border-pink-700 border-dashed text-pink-700 md:py-1.5 md:px-3">
              startups
            </span>{" "}
            and{" "}
            <span className="md:border border-violet-700 border-dashed text-violet-700 md:py-1.5 md:px-3">
              enterprises
            </span>
          </h1>
          <p className="text-lg sm:text-2xl text-gray-600 leading-8 sm:leading-relaxed max-w-4xl">
            Join thousands of developers and companies who have streamlined
            their{" "}
            <span className="block">
              LLM-powered application infrastructure with Helicone&apos;s
              solutions.
            </span>
          </p>

          <div className="flex flex-row gap-8 pt-8">
            <button
              onClick={() => {
                router.push("/signup");
              }}
              className="bg-gray-900 hover:bg-gray-700 whitespace-nowrap rounded-xl px-6 py-3 text-md md:text-lg font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              Get Started
            </button>
          </div>
          <div className="flex flex-col md:flex-row pt-4 md:divide-x-2 gap-[14px] justify-center w-full items-center divide-gray-300">
            <Link
              href="https://www.ycombinator.com/launches/I73-helicone-open-source-observability-platform-for-generative-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex space-x-6 font-semibold text-gray-600 md:w-52"
            >
              Backed by{" "}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mr-1 ml-2"
              >
                <g clipPath="url(#clip0_24_57)">
                  <rect width="24" height="24" rx="5.4" fill="#FF5100"></rect>
                  <rect
                    x="0.5"
                    y="0.5"
                    width="23"
                    height="23"
                    rx="4.9"
                    stroke="#FF844B"
                  ></rect>
                  <path
                    d="M7.54102 7.31818H9.28604L11.9458 11.9467H12.0552L14.715 7.31818H16.46L12.7662 13.5028V17.5H11.2349V13.5028L7.54102 7.31818Z"
                    fill="white"
                  ></path>
                </g>
                <rect
                  x="0.5"
                  y="0.5"
                  width="23"
                  height="23"
                  rx="4.9"
                  stroke="#FF5100"
                  strokeOpacity="0.1"
                ></rect>
                <rect
                  x="0.5"
                  y="0.5"
                  width="23"
                  height="23"
                  rx="4.9"
                  stroke="url(#paint0_radial_24_57)"
                ></rect>
                <defs>
                  <radialGradient
                    id="paint0_radial_24_57"
                    cx="0"
                    cy="0"
                    r="1"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(7.35) rotate(58.475) scale(34.1384)"
                  >
                    <stop stopColor="white" stopOpacity="0.56"></stop>
                    <stop
                      offset="0.28125"
                      stopColor="white"
                      stopOpacity="0"
                    ></stop>
                  </radialGradient>
                  <clipPath id="clip0_24_57">
                    <rect width="24" height="24" rx="5.4" fill="white"></rect>
                  </clipPath>
                </defs>
              </svg>{" "}
              Combinator
            </Link>
            <div className="font-semibold text-gray-600 pl-4 flex items-center md:w-56">
              Fully open-source{" "}
              <HeartIcon className="h-4 w-4 inline ml-2 text-pink-500" />
            </div>
          </div>

          <div className="flex flex-col pt-24">
            <div className="-m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-2.5 lg:rounded-xl lg:p-2.5">
              <Image
                src="/assets/home/request-preview.webp"
                alt="App screenshot"
                width={2720}
                height={1844}
                className="w-[70rem] rounded-lg shadow-2xl ring-1 ring-gray-900/10"
              />
            </div>
          </div>
          <div className="mx-auto px-6 lg:px-8 pt-32">
            <h2 className="text-center text-lg font-medium text-gray-600">
              Unlocking the full potential of LLM&apos;s.
            </h2>
            <h2 className="text-center text-lg font-medium text-gray-900">
              Modern startups and enterprises use Helicone.
            </h2>
            <div className="w-full mx-auto mt-10 grid max-w-lg grid-cols-4 items-center gap-x-8 gap-y-10 sm:max-w-xl sm:gap-x-10 lg:mx-0 lg:max-w-none">
              <Image
                className="col-span-2 max-h-24 w-full object-contain lg:col-span-1"
                src="/assets/home/logos/upenn.png"
                alt="upenn"
                width={400}
                height={100}
              />
              <Image
                className="col-span-2 max-h-12 w-full object-contain lg:col-span-1"
                src="/assets/home/logos/carta.png"
                alt="carta"
                width={400}
                height={100}
              />
              <Image
                className="col-span-2 max-h-14 w-full object-contain lg:col-span-1"
                src="/assets/home/logos/lex.svg"
                alt="lex"
                width={158}
                height={48}
              />
              <Image
                className="col-span-2 max-h-10 w-full object-contain lg:col-span-1"
                src="/assets/home/logos/particl.png"
                alt="particle"
                width={158}
                height={48}
              />
              <Image
                className="col-span-2 max-h-12 w-full object-contain lg:col-span-1"
                src="/assets/home/logos/commandbar.svg"
                alt="commandbar"
                width={100}
                height={48}
              />
              <Image
                className="col-span-2 max-h-10 w-full object-contain lg:col-span-1"
                src="/assets/home/logos/mintlify.svg"
                alt="mintlify"
                width={125}
                height={48}
              />
              <Image
                className="col-span-2 max-h-24 w-full object-contain lg:col-span-1"
                src="/assets/home/logos/onboard.png"
                alt="onboard"
                width={300}
                height={100}
              />
              <Image
                className="col-span-2 max-h-16 w-full object-contain lg:col-span-1"
                src="/assets/home/logos/autogpt.png"
                alt="autogpt"
                width={158}
                height={48}
              />
            </div>
          </div>
        </div>
      </div>
      <section
        id="features"
        className="bg-gradient-to-b from-white to-gray-200 mt-24 pb-24 antialiased"
      >
        <div className="px-4 md:px-8 max-w-6xl justify-center items-center text-center flex flex-col mx-auto w-full space-y-8">
          <div className="flex flex-col space-y-4 w-full">
            <h2 className="text-4xl md:text-5xl font-semibold">
              Monitoring has never been easier
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto md:leading-normal">
              Designed to work out of the box, Helicone provides meaningful
              insights that help you understand your applications performance in
              real-time.
            </p>
            <div className="flex flex-row gap-6 pt-4 w-full justify-center">
              <button
                onClick={() => {
                  router.push("/signup");
                }}
                className="bg-gray-900 hover:bg-gray-700 whitespace-nowrap rounded-xl px-6 py-3 text-sm md:text-md font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              >
                Get Started
              </button>
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
                className="bg-white hover:bg-gray-200 whitespace-nowrap border border-gray-900 rounded-xl px-6 py-3 text-sm md:text-md font-semibold text-black shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              >
                {demoLoading && <ArrowPathIcon className="h-4 w-4 inline" />}
                View Demo
              </button>
            </div>
            <div className="grid grid-cols-8 gap-4 w-full py-8">
              <div className="bg-gradient-to-b from-gray-100 to-white border border-gray-300 col-span-8 md:col-span-5 rounded-xl  h-[26rem] flex flex-col p-8">
                <div className="w-full h-full flex relative mb-8 justify-center">
                  <Image
                    className="z-20 absolute bottom-0 shadow-sm rounded-lg border border-gray-200 col-span-2 max-h-48 w-fit object-contain lg:col-span-1"
                    src="/assets/home/bento/requests.webp"
                    alt="requests"
                    width={980}
                    height={604}
                  />
                  <Image
                    className="hidden md:block absolute bottom-16 right-0 shadow-sm rounded-lg border border-gray-200 col-span-2 max-h-44 w-fit object-contain lg:col-span-1"
                    src="/assets/home/bento/users.webp"
                    alt="users"
                    width={980}
                    height={604}
                  />
                  <Image
                    className="hidden md:block absolute bottom-10 left-0 shadow-sm rounded-lg border border-gray-200 col-span-2 max-h-48 w-fit object-contain lg:col-span-1"
                    src="/assets/home/bento/costs.webp"
                    alt="costs"
                    width={908}
                    height={608}
                  />
                </div>
                <div className="flex flex-col mt-auto space-y-2">
                  <h3 className="text-3xl font-semibold">
                    Meaningful Insights
                  </h3>
                  <p className="text-md text-gray-600">
                    High-level metrics to help you monitor your application
                  </p>
                </div>
              </div>
              <div className="bg-gradient-to-b from-gray-100 to-white border border-gray-300 col-span-8 md:col-span-3 rounded-xl h-[26rem] flex flex-col p-8">
                <div className="flex flex-col mt-auto space-y-2">
                  <div className="w-full h-full flex flex-col space-y-12 mb-8 justify-center">
                    <div className="flex flex-row gap-4 mx-auto">
                      <div className="text-7xl text-green-500 flex gap-0.5">
                        <span>+</span>
                        <span>2</span>
                      </div>
                      <div className="text-7xl text-red-500 flex gap-0.5">
                        <span>-</span>
                        <span>2</span>
                      </div>
                    </div>
                    <div className="flex flex-row gap-2 mx-auto">
                      <div className="h-8 w-8 border border-gray-200 bg-green-500" />
                      <div className="h-8 w-8 border border-gray-200 bg-green-500" />
                      <div className="h-8 w-8 border border-gray-200 bg-red-500" />
                      <div className="h-8 w-8 border border-gray-200 bg-red-500" />
                      <div className="h-8 w-8 border border-gray-200 bg-gray-500" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-semibold">2 lines of code</h3>
                  <p className="text-md text-gray-600">
                    Get integrated in seconds. Not days.
                  </p>
                </div>
              </div>
              <div className="bg-gradient-to-b from-gray-100 to-white border border-gray-300 col-span-8 md:col-span-3 rounded-xl h-[26rem] flex flex-col p-8">
                <div className="flex flex-col mt-auto space-y-2">
                  <div className="w-full h-full flex flex-col mb-8 justify-center items-center">
                    <Image
                      className="shadow-sm rounded-lg border border-gray-200 col-span-2 max-h-56 w-fit object-contain lg:col-span-1"
                      src="/assets/home/bento/models.png"
                      alt="costs"
                      width={778}
                      height={612}
                    />
                  </div>
                  <h3 className="text-3xl font-semibold">Model Breakdown</h3>
                  <p className="text-md text-gray-600">
                    Understand your model usage and costs.
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-b from-gray-100 to-white border border-gray-300 col-span-8 md:col-span-5 rounded-xl h-[26rem] flex flex-col p-8">
                <div className="flex flex-col mt-auto space-y-2">
                  <div className="w-full h-full flex relative mb-4 justify-center">
                    <Image
                      className="z-20 absolute bottom-0 shadow-sm rounded-lg border border-gray-300 col-span-2 max-h-[15.5rem] w-fit object-contain lg:col-span-1"
                      src="/assets/home/bento/experiment.png"
                      alt="requests"
                      width={1860}
                      height={834}
                    />
                  </div>
                  <h3 className="text-3xl font-semibold">
                    Practical Playground
                  </h3>
                  <p className="text-md text-gray-600">
                    Easily replay, debug, and experiment with your user&apos;s
                    sessions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section
        id="integration"
        className="bg-gradient-to-b from-gray-200 to-white py-36 antialiased"
      >
        <div className="px-4 md:px-8 max-w-6xl justify-center items-center text-center flex flex-col mx-auto w-full space-y-8">
          <div className="flex flex-col space-y-4">
            <h2 className="text-4xl md:text-5xl font-semibold">
              Any model, any scale
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl">
              We support any provider and model, as well as fine-tuned models.
              All with sub millisecond latency and query times.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 md:justify-center w-full">
            <div className="relative isolate bg-white h-[32rem] w-full border border-gray-300 shadow-sm rounded-xl flex justify-center items-center">
              <div className="w-full h-full rounded-xl p-8 flex flex-col space-y-4 text-left">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Support for all models
                </h2>
                <p className="text-lg text-gray-600 max-w-[18rem]">
                  Our custom-built mapper engine and gateway allows us to
                  support any model from any provider.
                </p>
              </div>
              <div className="bottom-0 absolute w-full">
                <div className="w-full flex flex-row space-x-4 justify-end p-8 relative h-full">
                  <div className="flex flex-col space-y-4 justify-end">
                    <Image
                      src={"/assets/home/providers/bard.png"}
                      alt={"bard"}
                      width={80}
                      height={80}
                      className="border border-gray-300 rounded-lg block md:hidden"
                    />
                    <Image
                      src={"/assets/home/providers/bard.png"}
                      alt={"bard"}
                      width={112}
                      height={112}
                      className="border border-gray-300 rounded-lg hidden md:block"
                    />
                  </div>
                  <div className="flex flex-col justify-end space-y-4">
                    <Image
                      src={"/assets/home/providers/llama2.png"}
                      alt={"llama2"}
                      width={80}
                      height={80}
                      className="border border-gray-300 rounded-lg block md:hidden"
                    />
                    <Image
                      src={"/assets/home/providers/llama2.png"}
                      alt={"llama2"}
                      width={112}
                      height={112}
                      className="border border-gray-300 rounded-lg hidden md:block"
                    />
                    <Image
                      src={"/assets/home/providers/together.png"}
                      alt={"together"}
                      width={80}
                      height={80}
                      className="border border-gray-300 rounded-lg block md:hidden"
                    />
                    <Image
                      src={"/assets/home/providers/together.png"}
                      alt={"together"}
                      width={112}
                      height={112}
                      className="border border-gray-300 rounded-lg hidden md:block"
                    />
                  </div>
                  <div className="flex flex-col space-y-4">
                    <Image
                      src={"/assets/home/providers/openai.png"}
                      alt={"openai"}
                      width={80}
                      height={80}
                      className="border border-gray-300 rounded-lg block md:hidden"
                    />
                    <Image
                      src={"/assets/home/providers/openai.png"}
                      alt={"openai"}
                      width={112}
                      height={112}
                      className="border border-gray-300 rounded-lg hidden md:block"
                    />
                    <Image
                      src={"/assets/home/providers/anthropic.png"}
                      alt={"ant"}
                      width={80}
                      height={80}
                      className="border border-gray-300 rounded-lg block md:hidden"
                    />

                    <Image
                      src={"/assets/home/providers/anthropic.png"}
                      alt={"anthropic"}
                      width={112}
                      height={112}
                      className="border border-gray-300 rounded-lg hidden md:block"
                    />
                    <Image
                      src={"/assets/home/providers/mistral.png"}
                      alt={"mis"}
                      width={80}
                      height={80}
                      className="border border-gray-300 rounded-lg block md:hidden"
                    />
                    <Image
                      src={"/assets/home/providers/mistral.png"}
                      alt={"mis"}
                      width={112}
                      height={112}
                      className="border border-gray-300 rounded-lg hidden md:block"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-hidden relative isolate bg-white h-[32rem] w-full border border-gray-300 shadow-sm rounded-xl flex justify-center items-center">
              <div className="w-full h-full rounded-xl p-8 flex flex-col space-y-4 text-left">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Built for scale
                </h2>
                <p className="text-lg text-gray-600 max-w-[18rem]">
                  We meticulously designed Helicone to support millions of
                  requests per second with no latency impact.
                </p>
              </div>
              <div className="-bottom-44 md:-bottom-32 items-center flex absolute md:-right-32 w-full justify-end">
                <Globe />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="tooling" className="bg-white py-24 antialiased">
        <div className="px-4 md:px-8 max-w-6xl justify-center items-center text-center flex flex-col mx-auto w-full space-y-8">
          <div className="flex flex-col space-y-4">
            <h2 className="text-4xl md:text-5xl font-semibold">
              Purpose-built tooling for LLM developers.
            </h2>
            <p className="text-lg md:text-xl text-gray-600">
              Everything you need to build, deploy, and scale your LLM-powered
              application
            </p>
            <div className="flex flex-row gap-6 pt-4 w-full justify-center">
              <Link
                href="https://docs.helicone.ai/introduction"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center bg-gray-900 hover:bg-gray-700 whitespace-nowrap rounded-xl px-6 py-3 text-sm md:text-md font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              >
                View Docs
              </Link>
              <Link
                href="https://discord.gg/zsSTcH2qhG"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white hover:bg-gray-200 whitespace-nowrap border border-gray-900 rounded-xl px-6 py-3 text-sm md:text-md font-semibold text-black shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              >
                Join Discord
              </Link>
            </div>
          </div>
          <div className="flex flex-col divide-y divide-gray-300 w-full">
            <div className="h-full rounded-xl flex flex-col text-left p-2 md:p-12">
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 md:justify-center -mt-2 ">
                {features.map((f, idx) => (
                  <li
                    key={idx}
                    className="flex flex-row gap-6 justify-start items-start pt-6 w-full"
                  >
                    <div className="relative isolate bg-white h-16 w-16 border border-gray-300 shadow-sm rounded-lg flex justify-center items-center">
                      <svg
                        className="absolute inset-0 -z-10 h-full w-full"
                        aria-hidden="true"
                      >
                        <rect
                          width="100%"
                          height="100%"
                          strokeWidth={0}
                          fill="url(#123)"
                        />
                      </svg>
                      <f.icon className={clsx(f.color, "h-6 w-6")} />
                    </div>
                    <div className="flex flex-col space-y-1 w-48">
                      <p className="text-black font-semibold text-lg text-left">
                        {f.title}
                      </p>
                      <p className="text-gray-700 text-md text-left">
                        {f.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="bg-white pt-36 pb-48 antialiased">
        <div className="mx-auto px-4 md:px-8 max-w-6xl divide-y divide-gray-900/10">
          <div className="flex flex-col space-y-4 text-center">
            <h2 className="text-4xl md:text-5xl font-semibold">
              Frequently asked questions
            </h2>
          </div>
          <dl className="mt-10 space-y-6 divide-y divide-gray-900/10">
            {faqs.map((faq) => (
              <Disclosure as="div" key={faq.question} className="pt-6">
                {({ open }) => (
                  <div>
                    <dt>
                      <Disclosure.Button className="flex w-full items-start justify-between text-left text-gray-900">
                        <span className="text-base font-semibold leading-7">
                          {faq.question}
                        </span>
                        <span className="ml-6 flex h-7 items-center">
                          {open ? (
                            <MinusSmallIcon
                              className="h-6 w-6"
                              aria-hidden="true"
                            />
                          ) : (
                            <PlusSmallIcon
                              className="h-6 w-6"
                              aria-hidden="true"
                            />
                          )}
                        </span>
                      </Disclosure.Button>
                    </dt>
                    <Disclosure.Panel as="dd" className="mt-2 pr-12">
                      <p className="text-base leading-7 text-gray-600">
                        {faq.answer}
                      </p>
                    </Disclosure.Panel>
                  </div>
                )}
              </Disclosure>
            ))}
          </dl>
        </div>
      </section>
      <Footer />
    </div>
  );
}
