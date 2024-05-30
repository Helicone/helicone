import Enterprise from "@/components/templates/landingPage/enterprise";
import Integrations from "@/components/templates/landingPage/integrations";
import Platform from "@/components/templates/landingPage/platform";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import {
  CheckCircleIcon,
  ChevronRightIcon,
  CodeBracketSquareIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

const faqs = [
  {
    question: "Is there a latency impact to my requests with Helicone's Proxy?",
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

export default function Home() {
  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-between text-black">
        <header className="text-center flex flex-col space-y-4 py-32 max-w-6xl mx-auto">
          <Link
            href="https://www.ycombinator.com/launches/I73-helicone-open-source-observability-platform-for-generative-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex space-x-6 font-light text-gray-600 items-center w-full justify-center"
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
          <h1 className="text-4xl md:text-5xl font-bold pt-4">
            LLM-Observability for{" "}
            <span className="text-sky-500">Developers</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600">
            The open-source platform for logging, monitoring, and debugging.
          </p>
          <div className="flex items-center gap-4 pt-4 w-full justify-center">
            <Link
              href="/contact"
              className="bg-white hover:bg-gray-100 ease-in-out duration-500 text-black border-[3px] border-gray-300 rounded-lg px-6 py-2 font-bold shadow-lg flex w-fit items-center gap-1"
            >
              Get a demo
            </Link>
            <Link
              href="/signup"
              className="bg-sky-500 hover:bg-sky-600 ease-in-out duration-500 text-white border-[3px] border-sky-700 rounded-lg pl-6 pr-4 py-2 font-bold shadow-lg flex w-fit items-center gap-1"
            >
              Start Building
              <ChevronRightIcon className="w-5 h-5 inline text-white" />
            </Link>
          </div>
          <ul className="flex flex-col md:flex-row gap-4 md:gap-16 md:justify-center px-4 pt-16 text-sm">
            <li className="flex items-center space-x-2">
              <CheckCircleIcon className="h-6 w-6 text-sky-500" />
              <span className="text-gray-600">
                Sub-millisecond latency impact
              </span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircleIcon className="h-6 w-6 text-sky-500" />
              <span className="text-gray-600">100% log coverage</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircleIcon className="h-6 w-6 text-sky-500" />
              <span className="text-gray-600">
                Industry-leading query times
              </span>
            </li>
          </ul>

          <div className="pt-8 md:pt-0">
            <Image
              src={"/static/dashboard.png"}
              alt={"Helicone Dashboard"}
              width={4733}
              height={2365}
            />
          </div>
        </header>
        <section
          id="logos"
          className="text-center flex flex-col space-y-4 pt-16 pb-32 max-w-6xl mx-auto w-full"
        >
          <h2 className="text-gray-600 text-lg md:text-xl">
            Ready for real production workloads
          </h2>
          <ul className="flex flex-col md:flex-row items-center gap-16 md:gap-0 w-full justify-between px-16 pt-4">
            <li>
              <dl className="flex flex-col space-y-2">
                <dt className="font-bold text-5xl">{"1,000"}</dt>
                <dd className="text-sm text-gray-600 font-light">
                  Requests processed per second
                </dd>
              </dl>
            </li>
            <li>
              <dl className="flex flex-col space-y-2">
                <dt className="font-bold text-5xl">{"1.2 Billion"}</dt>
                <dd className="text-sm text-gray-600 font-light">
                  Total Requests Logged
                </dd>
              </dl>
            </li>
            <li>
              <dl className="flex flex-col space-y-2">
                <dt className="font-bold text-5xl">99.99%</dt>
                <dd className="text-sm text-gray-600 font-light">Uptime SLA</dd>
              </dl>
            </li>
          </ul>
          <ul className="flex flex-wrap md:flex-row items-center w-full justify-center gap-10 md:gap-32 px-0 md:px-8 pt-16">
            <li className="w-32">
              <Image
                src={"/static/filevine.png"}
                alt={"Filevine"}
                width={300}
                height={77}
              />
            </li>
            <li className="w-32">
              <Image
                src={"/static/qawolf.webp"}
                alt={"QAWolf"}
                width={640}
                height={156}
              />
            </li>
            <li className="w-32">
              <Image
                src={"/static/mintlify.svg"}
                alt={"Mintlify"}
                width={300}
                height={77}
              />
            </li>
            <li className="w-32">
              <Image
                src={"/static/greptile.png"}
                alt={"Greptile"}
                width={300}
                height={77}
              />
            </li>
          </ul>
          <div className="grid grid-cols-4 gap-8"></div>
        </section>
        <section
          id="integrations"
          className="flex flex-col space-y-4 py-32 max-w-6xl mx-auto w-full"
        >
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-3xl md:text-4xl font-bold">
              Send your first event in{" "}
              <span className="text-sky-500">seconds</span>
            </h1>
            <p className="text-sm md:text-md text-gray-600">
              Get started with your preferred integration and provider.
            </p>
          </div>
          <Integrations />
        </section>
        <section className="w-full flex flex-col max-w-6xl mx-auto space-y-4 py-32 px-4">
          <h2 className="sr-only">
            One observability platform,{" "}
            <span className="text-sky-500">everything you need</span>
          </h2>
          <Platform />
        </section>
        <section id="enterprise" className="py-36">
          <h2 className="sr-only">
            Get to production-quality{" "}
            <span className="text-violet-800">faster</span>
          </h2>
          <div className="px-4 md:px-8 max-w-6xl justify-center items-center text-left sm:text-center flex flex-col mx-auto w-full space-y-8">
            <Enterprise />
          </div>
        </section>
        <section className="w-full bg-[#0b1c2d] relative isolate py-36 overflow-hidden">
          <div className="flex flex-col space-y-16 w-full">
            <div className="px-4 md:px-8 max-w-6xl justify-center items-center text-left sm:text-center flex flex-col mx-auto w-full space-y-8">
              <div className="flex items-start w-full">
                <div className="flex flex-col space-y-4 w-full md:w-2/3 text-center md:text-left">
                  <p className="text-lg font-bold text-cyan-500">Developer</p>
                  <h2 className="text-3xl sm:text-5xl font-bold sm:leading-[1.15] text-white">
                    Fully <span className="text-cyan-400">Open-Source</span>
                  </h2>
                  <p className="text-md md:text-lg text-gray-300 leading-7">
                    We believe in the power of community and the importance of
                    transparency. Helicone is fully open-source and available
                    for anyone to use.
                  </p>
                  <div
                    id="tech-stack"
                    className="flex flex-col space-y-4 py-8 text-left"
                  >
                    <h3 className="text-xl text-white font-semibold">
                      Our Tech Stack
                    </h3>
                    <ul className="font-semibold flex flex-col space-y-4 text-gray-300">
                      <li>
                        <span className="text-cyan-400">Frontend:</span>{" "}
                        <Link
                          href="https://react.dev/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          React
                        </Link>
                        ,{" "}
                        <Link
                          href="https://nextjs.org/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          Next.js
                        </Link>
                        ,{" "}
                        <Link
                          href="https://tailwindcss.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          TailwindCSS
                        </Link>
                      </li>
                      <li>
                        <span className="text-cyan-400">Backend:</span>{" "}
                        <Link
                          href="https://supabase.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          Supabase
                        </Link>
                        ,{" "}
                        <Link
                          href="https://clickhouse.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          Clickhouse
                        </Link>
                        ,{" "}
                        <Link
                          href="https://www.postgresql.org/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          Postgres
                        </Link>
                        ,{" "}
                        <Link
                          href="https://nodejs.org/en"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          Node
                        </Link>
                        ,{" "}
                        <Link
                          href="https://expressjs.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          Express
                        </Link>
                      </li>
                      <li>
                        <span className="text-cyan-400">Infrastructure:</span>{" "}
                        <Link
                          href="https://www.cloudflare.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          Cloudflare
                        </Link>
                        ,{" "}
                        <Link
                          href="https://aws.amazon.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          AWS
                        </Link>
                        ,{" "}
                        <Link
                          href="https://vercel.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          Vercel
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <ul className="py-4 flex flex-col space-y-8">
                    <li className="flex items-start space-x-2">
                      <div>
                        <ShieldCheckIcon className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div className="flex flex-col space-y-1 -mt-0.5">
                        <p className="text-sm md:text-lg font-bold text-white">
                          Interested in deploying Helicone on-prem?
                        </p>
                        <Link
                          className="text-sm md:text-md text-gray-500 font-medium flex items-center space-x-1"
                          href={"/contact"}
                        >
                          <span>Get in touch</span>
                          <ChevronRightIcon className="w-4 h-4" />
                        </Link>
                      </div>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div>
                        <UserGroupIcon className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div className="flex flex-col space-y-1 -mt-0.5">
                        <p className="text-sm md:text-lg font-bold text-white">
                          Want to ask the team a question?
                        </p>
                        <Link
                          className="text-sm md:text-md text-gray-500 font-medium flex items-center space-x-1"
                          href={"https://discord.gg/HwUbV3Q8qz"}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span>Join our discord server</span>
                          <ChevronRightIcon className="w-4 h-4" />
                        </Link>
                      </div>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div>
                        <CodeBracketSquareIcon className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div className="flex flex-col space-y-1 -mt-0.5">
                        <p className="text-sm md:text-lg font-bold text-white">
                          Want to contribute or star us on Github?
                        </p>
                        <Link
                          className="text-sm md:text-md text-gray-500 font-medium flex items-center space-x-1"
                          href={"https://github.com/Helicone/helicone"}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span>Check us out</span>
                          <ChevronRightIcon className="w-4 h-4" />
                        </Link>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
