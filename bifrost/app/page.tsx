import Enterprise from "@/components/templates/landing/enterprise";
import Integrations from "@/components/templates/landing/integrations";
import Platform from "@/components/templates/landing/platform";
import FAQ from "@/components/templates/landing/faq"
import { FaChevronRight, FaCheck } from "react-icons/fa6";
import Image from "next/image";
import Link from "next/link";
import Essentials from "@/components/templates/landing/essentials";
import OpenSource from "@/components/templates/landing/openSource";

export default function Home() {
  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-between text-black">
        <header className="flex flex-col px-6 space-y-4 pt-12 pb-3 md:pt-16 md:pb-5 max-w-6xl mx-auto lg:text-center">
          <Link
            href="https://www.ycombinator.com/launches/I73-helicone-open-source-observability-platform-for-generative-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm inline-flex space-x-6 mb-6 text-gray-600 items-center w-full lg:justify-center"
          >
            Backed by{" "}
            <svg
              width="20"
              height="20"
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
          <h1 className=" text-4xl md:text-5xl font-bold md:pt-4">
            LLM Observability for{" "}
            <span className="text-sky-500">Developers</span>
          </h1>
          <p className="text-sm font-light md:text-xl text-gray-600">
            The open-source platform for logging, monitoring and debugging.
          </p>
          <div className="flex items-center gap-4 pt-4 w-full md:justify-center">
            <Link
              href="/contact"
              className="bg-white hover:bg-gray-100 ease-in-out duration-500 text-gray-600 border-[1.6px] border-gray-300 rounded-lg px-2 py-2 text-sm font-medium flex w-fit items-center gap-1 md:px-6 md:py-2 md:text-lg"
            >
              Get a demo
            </Link>
            <Link
              href="https://us.helicone.ai/signup"
              className="bg-sky-500 hover:bg-sky-600 ease-in-out duration-500 md:border-[1.6px] border-sky-700 text-white rounded-lg pl-2 pr-2 py-2 text-sm font-semibold flex w-fit items-center gap-1 md:px-5 md:py-2 md:text-lg"
            >
              Start Building
              <FaChevronRight className="w-2 h-3 inline text-white mx-1 md:mx-1" />
            </Link>
          </div>
          <ul className="flex flex-col md:flex-row gap-3 md:gap-16 md:justify-center pt-7 md:pt-16 text-sm">
            <li className="flex items-center space-x-2">
              <FaCheck className="h-4 w-6 text-sky-500" />
              <span className="text-gray-600 font-light md:text-xl">
                industry-leading query time
              </span>
            </li>
            <li className="flex items-center space-x-2">
              <FaCheck className="h-4 w-6 text-sky-500" />
              <span className="text-gray-600 font-light md:text-xl">sub-millisecond latency</span>
            </li>
            <li className="flex items-center space-x-2">
              <FaCheck className="h-4 w-6 text-sky-500" />
              <span className="text-gray-600 font-light md:text-xl">
                100% log coverage
              </span>
            </li>
          </ul>

          <div className="pt-8 md:pt-0">
            <Image
              src={"/static/dashboard.webp"}
              alt={"Helicone Dashboard"}
              width={4733}
              height={2365}
              priority
            />
          </div>
        </header>
        <section
          id="logos"
          className="flex flex-col space-y-4 pt-6 md:pb-14 md:pt-24 px-3 max-w-6xl mx-auto w-full"
        >
          <h2 className="text-gray-600 font-bold px-3 text-sm block md:hidden">
            Ready for real production workloads
          </h2>
          <h2 className="text-gray-600 font-light text-center px-3 text-lg hidden md:block">
            Trusted by thousands of companies and developers
          </h2>
          <ul className="flex flex-col md:flex-row gap-9 md:gap-0 w-full justify-between px-3 pt-4 md:hidden">
            <li>
              <dl className="flex flex-col space-y-2">
                <dt className="font-bold text-gray-600 indent-3 text-2xl text border-l-2 border-sky-500">
                  {"1,000"}</dt>
                <dd className="text-sm text-gray-600 indent-3 font-light">
                  Requests processed per second
                </dd>
              </dl>
            </li>
            <li>
              <dl className="flex flex-col space-y-2">
                <dt className="font-bold text-gray-600 indent-3 text-2xl border-l-2 border-sky-500">
                  {"1.2 Billion"}</dt>
                <dd className="text-sm text-gray-600 indent-3 font-light">
                  Total requests Logged
                </dd>
              </dl>
            </li>
            <li>
              <dl className="flex flex-col space-y-2">
                <dt className="font-bold text-gray-600 indent-3 text-2xl border-l-2 border-sky-500">
                  99.99%</dt>
                <dd className="text-sm text-gray-600 indent-3 font-light">Uptime</dd>
              </dl>
            </li>
          </ul>
          <ul className="flex flex-wrap md:grid md:grid-cols-4 text-center items-center justify-center gap-10 md:gap- px-0 md:px-16 pt-16">
            <li className="w-32 text-center">
              <Image
                src={"/static/qawolf.webp"}
                alt={"QAWolf"}
                width={640}
                height={156}
              />
            </li>
            <li className="w-32">
              <Image
                src={"/static/filevine.webp"}
                alt={"Filevine"}
                width={300}
                height={77}
              />
            </li>
            <li className="w-32">
              <Image
                src={"/static/mintlify.svg"}
                alt={"Mintlify"}
                width={300}
                height={80}
              />
            </li>
            <li className="w-32">
              <Image
                src={"/static/greptile.webp"}
                alt={"Greptile"}
                width={300}
                height={77}
              />
            </li>
            <li className="w-32">
              <Image
                src={"/static/codegen.webp"}
                alt={"Codegen"}
                width={300}
                height={77}
              />
            </li><li className="w-32">
              <Image
                src={"/static/sunrun.webp"}
                alt={"Sunrun"}
                width={300}
                height={77}
              />
            </li>
            <li className="w-32">
              <Image
                src={"/static/lex.svg"}
                alt={"Lex"}
                width={300}
                height={77}
              />
            </li>
            <li className="w-32">
              <Image
                src={"/static/connect.svg"}
                alt={"Connect"}
                width={300}
                height={77}
              />
            </li>
          </ul>
        </section>
        <section
          id="integrations"
          className="flex flex-col space-y-4 py-12 px-3 max-w-6xl mx-auto w-full"
        >
          <div className="flex flex-col space-y-2 px-3 md:text-center">
            <h1 className="text-3xl md:text-5xl font-bold">
              Send your first events in{" "}
              <span className="text-sky-500">seconds</span>
            </h1>
            <p className="text-sm font-light text-gray-600 block md:hidden pt-2">
              Get started with your preferred integration and provider.
            </p>
            <p className="text-lg font-light text-gray-600 pt-3 hidden md:block">
              Get started with your favorite provider and programming language.
            </p>
            <span className="text-lg font-light text-gray-600 hidden md:block ">Don't see your model? Let us know by <p className="inline font-semibold underline ">creating an issue on Github</p>!</span>
          </div>
          <Integrations />
        </section>
        <section
          id="essentials"
          className="flex flex-col px-3 pt-6 pb-12 gap-6 md:pt-24 md:pb-14 md:px-0 md:gap-24 mx-auto max-w-full">
          <div className="flex flex-col px-3 space-y-2 gap-3 md:gap-3">
            <h1 className="text-3xl font-bold text-sky-500 gap-3 md:text-center md:text-5xl ">Unified {" "}
              <span className="text-black">observability and monitoring</span>
            </h1>
            <p className="font-light text-sm text-gray-600 md:text-center md:text-xl">
              We are building a platform that provides all the essential tools for observability in Gen AI.
            </p>
          </div>
            <Essentials />
        </section>
        <section id="enterprise" className="py-6">
          <h2 className="sr-only">
            Get to production-quality{" "}
            <span className="text-violet-800">faster</span>
          </h2>
          <div className="px-4 md:px-8 max-w-6xl justify-center items-center text-left sm:text-center flex flex-col mx-auto w-full space-y-8">
            <Enterprise />
          </div>
        </section>
        <section className="w-full flex flex-col gap-4 max-w-6xl mx-auto space-y-4 py-32 px-4">
          <h2 className="sr-only">
            No packages, just{" "}
            <span className="text-sky-500">headers</span>
          </h2>
          <Platform />
        </section>
        <section id="opensource" className="max-w-6xl lg:py-20 lg:px-7 py-6 px-3">
          <div className="px-3 lg:text-center">
            <h1 className="sr-only">Frequently asked questions</h1>
            <OpenSource />
          </div>
        </section>
        <section id="faq" className="w-full max-w-6xl lg:py-20 lg:px-7 py-12 px-3">
          <div className="px-3 lg:text-center">
            <h1 className="font-bold text-3xl md:text-5xl lg:py-6">Frequently asked questions</h1>
            <FAQ />
          </div>
        </section>
        <section className="w-full lg:flex  bg-blue-800 hidden">
          <div className="bg-[url('/static/leftbg.webp')] bg-repeat">
            <Image
              src={"/static/left-sidecube.webp"}
              alt=""
              height={500}
              width={500}
              className=""
            />
          </div>
          <div className="flex flex-col items-center gap-12 py-12 px-12 ">
            <div className="px-3 lg:text-center">
              <h1 className="font-semibold text-5xl text-white md:text-5xl lg:py-6">Starting with Helicone is simple, free and fun.</h1>
              <p className="text-white text-2xl font-light">Join users from all over the planet that used Helicone to supercharge their AI workflow.</p>
            </div>
            <div className="flex flex-row gap-[10px] ">
              <button className="text-white text-lg border-2 px-6 py-2 rounded-lg font-semibold">Get a demo</button>
              <button className="text-blue-800 bg-white text-lg border-2 px-6 py-3 rounded-lg font-semibold ">Start for free <FaChevronRight className="inline h-5 w-5 pb-1" /> </button>
            </div>
          </div>
          <div className="bg-[url('/static/rightbg.webp')]">
            <Image
              src={"/static/right-sidecube.webp"}
              alt=""
              height={500}
              width={500}
              className=""
            />
          </div>
        </section>
      </main>
    </>
  );
}
