import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { Database } from "../../../supabase/database.types";
import { DEMO_EMAIL } from "../../../lib/constants";
import GridBackground from "../../layout/public/gridBackground";
import NavBarV2 from "../../layout/navbar/navBarV2";
import Footer from "../../layout/footer";
import {
  ArrowPathIcon,
  ChartPieIcon,
  ChevronRightIcon,
  CodeBracketIcon,
  HeartIcon,
} from "@heroicons/react/20/solid";
import Image from "next/image";
import { clsx } from "../../shared/clsx";
import Link from "next/link";
import Globe from "./globe";
import Steps from "./components/steps";
import {
  BuildingOffice2Icon,
  CircleStackIcon,
  CodeBracketSquareIcon,
  CubeIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import Features from "./components/features";

interface HomePageV3Props {}

const HomePageV3 = (props: HomePageV3Props) => {
  const {} = props;

  const [demoLoading, setDemoLoading] = useState(false);

  const router = useRouter();
  const user = useUser();

  const supabaseClient = useSupabaseClient<Database>();

  if (!demoLoading && user?.email === DEMO_EMAIL) {
    supabaseClient.auth.signOut();
  }

  return (
    <div className="w-full bg-gray-50 h-full antialiased">
      <NavBarV2 />
      <GridBackground>
        <header className="w-full flex flex-col space-y-4 sm:space-y-6 mx-auto max-w-6xl h-full py-16 sm:py-24 items-center text-center px-4 sm:px-4 lg:px-0">
          <div className="text-xs mx-auto flex flex-col sm:flex-row sm:divide-x-2 gap-[14px] justify-center items-center divide-gray-300 opacity-75 w-fit px-4 py-1 rounded-xl">
            <Link
              href="https://www.ycombinator.com/launches/I73-helicone-open-source-observability-platform-for-generative-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex space-x-6 font-semibold text-gray-600 items-center"
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
            <div className="font-semibold text-gray-600 pl-4 flex items-center">
              Fully open-source{" "}
              <HeartIcon className="h-4 w-4 inline ml-2 text-pink-500" />
            </div>
          </div>
          <h1 className="text-5xl sm:text-7xl block font-bold w-full h-full tracking-tight text-center items-center sm:leading-[1]">
            How developers{" "}
            <span className="text-sky-500 block sm:inline">
              build AI <span className="inline sm:hidden">apps</span>
              <span className="hidden sm:inline">applications</span>
            </span>
          </h1>
          <p className="text-gray-700 font-medium text-lg sm:text-2xl sm:leading-8">
            Meet the lightweight, yet powerful platform purpose-built for
            Generative AI
          </p>
          <div className="flex items-center gap-4">
            <button className="bg-sky-200 text-sky-950 border-2 border-sky-500 rounded-lg pl-4 pr-2 py-2 font-bold shadow-lg hover:shadow-sky-300 transition-shadow duration-500 flex w-fit items-center gap-1">
              Start Building
              <ChevronRightIcon className="w-5 h-5 inline text-sky-700" />
            </button>
            <button className="bg-white text-black border-2 border-gray-500 rounded-lg pl-4 pr-2 py-2 font-bold shadow-lg hover:shadow-sky-300 transition-shadow duration-500 flex w-fit items-center gap-1">
              Get a demo
              <ChevronRightIcon className="w-5 h-5 inline text-black" />
            </button>
          </div>
        </header>
      </GridBackground>

      <section className="w-full max-w-6xl mx-auto justify-center items-center pt-8 sm:pb-32 px-4 flex flex-col space-y-16">
        <Features />
      </section>
      <section className="w-full flex flex-col max-w-6xl mx-auto space-y-16 py-32 px-4">
        <div className="flex flex-col w-full items-center text-center">
          <h3 className="text-3xl sm:text-5xl font-bold text-black text-center tracking-tight leading-tight">
            Trusted by thousands of{" "}
            <span className="text-violet-500">startups and enterprises</span>
          </h3>
          <p className="text-gray-700 font-medium text-xl leading-8 mt-2">
            Helicone is built to scale with your business, no matter the size.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 items-center gap-16 w-full mx-auto justify-between font-mono tracking-tighter p-4">
          <div className="flex flex-col w-full">
            <dd className="text-black text-3xl font-bold">125M</dd>
            <dt className="text-gray-500 text-md">requests per month</dt>
          </div>
          <div className="flex flex-col w-full">
            <dd className="text-black text-3xl font-bold">{`>1 BILLION`}</dd>
            <dt className="text-gray-500 text-md">total requests</dt>
          </div>
          <div className="flex flex-col w-full">
            <dd className="text-black text-3xl font-bold">{`>$30k+`}</dd>
            <dt className="text-gray-500 text-md">total cache savings</dt>
          </div>
          <div className="flex flex-col w-full">
            <dd className="text-black text-3xl font-bold">5000+</dd>
            <dt className="text-gray-500 text-md">total users</dt>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-4 sm:gap-8 xl:gap-16 w-fit mx-auto">
          <div
            className={clsx(
              `h-32 w-32 border-[3px] border-black rounded-lg shadow-lg flex items-center justify-center bg-white`
            )}
          >
            <Image
              src={"/assets/home/logos/logo.svg"}
              alt={""}
              width={100}
              height={100}
            />
          </div>{" "}
          <div
            className={clsx(
              `h-32 w-32 border-[3px] border-black rounded-lg shadow-lg flex items-center justify-center bg-white`
            )}
          >
            <Image
              src={"/assets/home/logos/qawolf.png"}
              alt={""}
              width={100}
              height={100}
            />
          </div>{" "}
          <div
            className={clsx(
              `h-32 w-32 border-[3px] border-black rounded-lg shadow-lg flex items-center justify-center bg-white`
            )}
          >
            <Image
              src={"/assets/home/logos/carta.png"}
              alt={""}
              width={100}
              height={100}
            />
          </div>{" "}
          <div
            className={clsx(
              `h-32 w-32 border-[3px] border-black rounded-lg shadow-lg flex items-center justify-center bg-white`
            )}
          >
            <Image
              src={"/assets/home/logos/reworkd.png"}
              alt={""}
              className="invert"
              width={100}
              height={100}
            />
          </div>{" "}
          <div
            className={clsx(
              `h-32 w-32 border-[3px] border-black rounded-lg shadow-lg flex items-center justify-center bg-white`
            )}
          >
            <Image
              src={"/assets/home/logos/lex.svg"}
              alt={""}
              width={80}
              height={80}
            />
          </div>{" "}
          <div
            className={clsx(
              `h-32 w-32 border-[3px] border-black rounded-lg shadow-lg flex items-center justify-center bg-white`
            )}
          >
            <Image
              src={"/assets/home/logos/particl.png"}
              alt={""}
              width={100}
              height={100}
            />
          </div>{" "}
          <div
            className={clsx(
              `h-32 w-32 border-[3px] border-black rounded-lg shadow-lg flex items-center justify-center bg-white`
            )}
          >
            <Image
              src={"/assets/home/logos/mintlify.svg"}
              alt={""}
              width={100}
              height={100}
            />
          </div>{" "}
          <div
            className={clsx(
              `h-32 w-32 border-[3px] border-black rounded-lg shadow-lg flex items-center justify-center bg-white`
            )}
          >
            <Image
              src={"/assets/home/logos/onboard.png"}
              alt={""}
              width={300}
              height={300}
            />
          </div>
        </div>
      </section>
      <section className="w-full bg-[#0b1c2d] relative isolate overflow-hidden mt-32">
        <div className="max-w-6xl mx-auto flex flex-col space-y-2 py-28 h-full px-16">
          <h3 className="text-5xl font-bold text-white text-center tracking-tight leading-tight">
            Made by developers,{" "}
            <span className="text-cyan-400">for developers</span>
          </h3>
          <p className="text-gray-300 font-medium text-xl leading-8 text-center">
            This is the easiest integration you will ever do. We promise
          </p>

          <div className="flex gap-4 flex-col space-y-4 pt-16">
            <Steps />
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-4 pt-16 gap-8">
            <li className="col-span-1 flex items-start space-x-2">
              <div>
                <CodeBracketSquareIcon className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="flex flex-col space-y-1">
                <h2 className="text-md font-bold text-white">Any Model</h2>
                <p className="text-sm text-gray-300 font-medium">
                  Bring any model from any provider to Helicone.
                </p>
              </div>
            </li>
            <li className="col-span-1 flex items-start space-x-2">
              <div>
                <BuildingOffice2Icon className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="flex flex-col space-y-1">
                <h2 className="text-md font-bold text-white">Any Scale</h2>
                <p className="text-sm text-gray-300 font-medium">
                  Log millions of requests per second with no latency impact.
                </p>
              </div>
            </li>
            <li className="col-span-1 flex items-start space-x-2">
              <div>
                <CubeIcon className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="flex flex-col space-y-1">
                <h2 className="text-md font-bold text-white">Async Packages</h2>
                <p className="text-sm text-gray-300 font-medium">
                  We offer async packages for all major languages.
                </p>
              </div>
            </li>
            <li className="col-span-1 flex items-start space-x-2">
              <div>
                <ShieldCheckIcon className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="flex flex-col space-y-1">
                <h2 className="text-md font-bold text-white">
                  On-prem deployments
                </h2>
                <p className="text-sm text-gray-300 font-medium">
                  Deploy Helicone on-prem for maximum security.
                </p>
              </div>
            </li>
          </ul>
        </div>
        <div className="-bottom-44 md:-bottom-56 items-center flex absolute md:-right-1/3 w-full justify-end opacity-10 -z-10">
          <Globe />
        </div>
      </section>
      {/* <section className="w-full relative isolate overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col space-y-4 py-36 h-full">
          <h3 className="text-5xl font-bold text-white text-center tracking-tight leading-tight">
            Code Examples
            <span className="text-cyan-400"></span>
          </h3>
          <p className="text-gray-400 font-medium text-2xl leading-8 text-center">
            Powerful features with minimal code
          </p>
          <div className="w-full flex justify-center gap-16 mx-auto py-8">
            <ul className="w-fit flex items-center gap-16 text-white">
              <li className="flex flex-col items-center gap-4">
                <div className="p-4 border-2 border-cyan-700 rounded-lg">
                  <ChartPieIcon className="w-8 h-8 text-cyan-400 " />
                </div>
                <p className="text-md font-bold">Labeling</p>
              </li>
              <li className="flex flex-col items-center gap-4">
                <div className="p-4 border border-gray-700 rounded-lg">
                  <ChartPieIcon className="w-8 h-8 text-gray-400 " />
                </div>
                <p className="text-md font-bold text-gray-400">Labeling</p>
              </li>{" "}
              <li className="flex flex-col items-center gap-4">
                <div className="p-4 border border-gray-700 rounded-lg">
                  <ChartPieIcon className="w-8 h-8 text-gray-400 " />
                </div>
                <p className="text-md font-bold text-gray-400">Labeling</p>
              </li>{" "}
              <li className="flex flex-col items-center gap-4">
                <div className="p-4 border border-gray-700 rounded-lg">
                  <ChartPieIcon className="w-8 h-8 text-gray-400 " />
                </div>
                <p className="text-md font-bold text-gray-400">Labeling</p>
              </li>{" "}
              <li className="flex flex-col items-center gap-4">
                <div className="p-4 border border-gray-700 rounded-lg">
                  <ChartPieIcon className="w-8 h-8 text-gray-400 " />
                </div>
                <p className="text-md font-bold text-gray-400">Labeling</p>
              </li>{" "}
              <li className="flex flex-col items-center gap-4">
                <div className="p-4 border border-gray-700 rounded-lg">
                  <ChartPieIcon className="w-8 h-8 text-gray-400 " />
                </div>
                <p className="text-md font-bold text-gray-400">Labeling</p>
              </li>{" "}
              <li className="flex flex-col items-center gap-4">
                <div className="p-4 border border-gray-700 rounded-lg">
                  <ChartPieIcon className="w-8 h-8 text-gray-400 " />
                </div>
                <p className="text-md font-bold text-gray-400">Labeling</p>
              </li>{" "}
              <li className="flex flex-col items-center gap-4">
                <div className="p-4 border border-gray-700 rounded-lg">
                  <ChartPieIcon className="w-8 h-8 text-gray-400 " />
                </div>
                <p className="text-md font-bold text-gray-400">Labeling</p>
              </li>{" "}
            </ul>
          </div>
          <div className="flex flex-row space-x-8 mx-16 p-8 rounded-xl">
            <div className="flex flex-col space-y-4 max-w-[18rem]">
              <h2 className="text-2xl font-semibold text-white">Labeling</h2>
              <p className="text-lg text-gray-300">
                Our custom-built mapper engine and gateway allows us to support
                any model from any provider.
              </p>
            </div>
            <div className="h-96 rounded-lg w-full bg-sky-950"></div>
          </div>
        </div>
      </section> */}
      <section id="integration" className="py-36">
        <div className="px-4 md:px-8 max-w-6xl justify-center items-center text-left sm:text-center flex flex-col mx-auto w-full space-y-8">
          <div className="flex flex-col space-y-2 pb-2">
            <h3 className="text-5xl font-bold text-black text-center tracking-tight leading-tight">
              Join our <span className="text-pink-500">open source</span>{" "}
              community
            </h3>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl">
              Developers from around the world are helping us build the future
              of AI
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 md:justify-center w-full">
            <div className="relative isolate bg-white h-[32rem] w-full border-[3px] border-black shadow-sm rounded-xl flex justify-center items-center">
              <div className="w-full h-full rounded-xl p-8 flex flex-col space-y-4 text-left">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Deploy Anywhere
                </h2>
                <p className="text-lg text-gray-600 max-w-[18rem]">
                  We have a cloud-hosted solution, but also offer on-prem
                  deployments for maximum security.
                </p>
                <Link
                  href="/sales"
                  className="bg-white text-black border-2 border-gray-500 rounded-lg pl-4 pr-2 py-2 font-bold shadow-lg hover:shadow-sky-300 transition-shadow duration-500 flex w-fit items-center gap-1"
                >
                  Deploy on Prem
                  <ChevronRightIcon className="w-5 h-5 inline text-black" />
                </Link>
              </div>
              <div className="bottom-0 absolute w-full">
                <div className="w-full flex flex-row space-x-4 justify-end p-8 relative h-full">
                  <div className="h-28 w-28 rounded-lg bg-white shadow-lg flex items-center justify-center border-[3px] border-black p-4">
                    <Image
                      src={"/assets/landing/aws.svg.png"}
                      alt={"aws"}
                      width={80}
                      height={80}
                      className=""
                    />
                  </div>
                  <div className="h-28 w-28 rounded-lg bg-white shadow-lg flex items-center justify-center border-[3px] border-black p-4">
                    <Image
                      src={"/assets/landing/gcp.svg.png"}
                      alt={"aws"}
                      width={80}
                      height={80}
                      className=""
                    />
                  </div>
                  <div className="h-28 w-28 rounded-lg bg-white shadow-lg flex items-center justify-center border-[3px] border-black p-4">
                    <Image
                      src={"/assets/landing/azure.svg.png"}
                      alt={"aws"}
                      width={80}
                      height={80}
                      className=""
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-hidden relative isolate bg-white h-[32rem] w-full border-[3px] border-black shadow-sm rounded-xl flex justify-center items-center">
              <div className="w-full h-full rounded-xl p-8 flex flex-col space-y-4 text-left">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Join Our Community
                </h2>
                <p className="text-lg text-gray-600 max-w-[18rem]">
                  Have a question? Want to contribute? Join our Discord server
                  or check out our GitHub.
                </p>
                <div className="flex items-center gap-4">
                  <Link
                    href="https://discord.gg/2TkeWdXNPQ"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-black border-2 border-gray-500 rounded-lg pl-4 pr-2 py-2 font-bold shadow-lg hover:shadow-sky-300 transition-shadow duration-500 flex w-fit items-center gap-1"
                  >
                    Join Discord
                    <ChevronRightIcon className="w-5 h-5 inline text-black" />
                  </Link>
                  <Link
                    href="https://github.com/Helicone/helicone"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-black border-2 border-gray-500 rounded-lg pl-4 pr-2 py-2 font-bold shadow-lg hover:shadow-sky-300 transition-shadow duration-500 flex w-fit items-center gap-1"
                  >
                    View Github
                    <ChevronRightIcon className="w-5 h-5 inline text-black" />
                  </Link>
                </div>
              </div>
              <div className="bottom-0 absolute w-full">
                <div className="w-full flex flex-row justify-center items-center p-8 relative h-full">
                  <div className="h-40 w-40 absolute bottom-12 left-12 -rotate-6 rounded-lg bg-white shadow-lg flex items-center justify-center border-[3px] border-black p-4">
                    <div className="flex flex-col w-full">
                      <dd className="text-violet-500 text-3xl font-bold">{`>50`}</dd>
                      <dt className="text-gray-500 text-md">contributors</dt>
                    </div>
                  </div>
                  <div className="z-30 h-40 w-40 absolute rounded-lg bottom-4 mx-auto bg-white shadow-lg flex items-center justify-center border-[3px] border-black p-4">
                    <div className="flex flex-col w-full">
                      <dd className="text-3xl font-bold text-yellow-500">
                        1.2k
                      </dd>
                      <dt className="text-gray-500 text-md">stars</dt>
                    </div>
                  </div>
                  <div className="h-40 w-40 rotate-6 bottom-12 right-12 absolute rounded-lg bg-white shadow-lg flex items-center justify-center border-[3px] border-black p-4">
                    <div className="flex flex-col w-full">
                      <dd className="text-green-500 text-3xl font-bold">{`>1B`}</dd>
                      <dt className="text-gray-500 text-md">requests logged</dt>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePageV3;
