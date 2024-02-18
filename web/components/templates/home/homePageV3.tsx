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
        <header className="w-full flex flex-col space-y-6 mx-auto max-w-6xl h-full py-32 items-center text-center">
          <h1 className="text-7xl block font-bold w-full h-full tracking-tight text-center items-center leading-[1]">
            How developers{" "}
            <span className="text-green-500">build AI applications</span>
          </h1>
          <p className="text-gray-700 font-medium text-2xl leading-8">
            Meet the lightweight, yet powerful platform purpose-built for
            Generative AI
          </p>
          <div className="flex items-center gap-4">
            <button className="flex items-center bg-gray-900 hover:bg-gray-700 whitespace-nowrap rounded-lg px-4 py-2 text-md font-semibold text-white shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500">
              Get Started for Free
            </button>
            <button className="font-semibold text-sm flex items-center">
              Contact Sales <ChevronRightIcon className="w-5 h-5 inline" />
            </button>
          </div>
        </header>
      </GridBackground>
      <section className="w-full max-w-6xl mx-auto pb-16 px-4">
        <Features />
      </section>
      <section className="w-full flex flex-col max-w-6xl mx-auto space-y-20 py-32 px-4">
        <div className="flex flex-col w-full items-center">
          <h3 className="text-5xl font-bold text-black text-center tracking-tight leading-tight">
            Trusted by thousands of{" "}
            <span className="text-violet-500">startups and enterprises</span>
          </h3>
          <p className="text-gray-700 font-medium text-xl leading-8 mt-2">
            Helicone is built to scale with your business, no matter the size.
          </p>
        </div>
        <div className="grid grid-cols-4 gap-16 w-full mx-auto justify-center font-mono tracking-tighter">
          <div className="flex flex-col">
            <dd className="text-black text-4xl font-bold">125M</dd>
            <dt className="text-gray-500 text-md">requests per month</dt>
          </div>
          <div className="flex flex-col">
            <dd className="text-black text-4xl font-bold">1 BILLION</dd>
            <dt className="text-gray-500 text-md">total requests</dt>
          </div>
          <div className="flex flex-col">
            <dd className="text-black text-4xl font-bold">$30k+</dd>
            <dt className="text-gray-500 text-md">total cache savings</dt>
          </div>
          <div className="flex flex-col">
            <dd className="text-black text-4xl font-bold">5000+</dd>
            <dt className="text-gray-500 text-md">total users</dt>
          </div>
        </div>
        <div className="grid grid-cols-6 gap-8">
          <div
            className={clsx(
              `h-20 w-20 sm:h-32 sm:w-32 rounded-lg flex items-center justify-center font-semibold text-sm`
            )}
          >
            <Image
              src={"/assets/home/logos/logo.svg"}
              alt={""}
              width={100}
              height={100}
            />
          </div>
          <div
            className={clsx(
              `h-20 w-20 sm:h-32 sm:w-32 border-4 border-black rounded-lg shadow-lg flex items-center justify-center font-semibold text-sm bg-white`
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
              `h-20 w-20 sm:h-32 sm:w-32 border-4 border-black rounded-lg shadow-lg flex items-center justify-center font-semibold text-sm bg-white`
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
              `h-20 w-20 sm:h-32 sm:w-32 border-4 border-black rounded-lg shadow-lg flex items-center justify-center font-semibold text-sm bg-white`
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
              `h-20 w-20 sm:h-32 sm:w-32 border-4 border-black rounded-lg shadow-lg flex items-center justify-center font-semibold text-sm bg-white`
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
              `h-20 w-20 sm:h-32 sm:w-32 border-4 border-black rounded-lg shadow-lg flex items-center justify-center font-semibold text-sm bg-white`
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
              `h-20 w-20 sm:h-32 sm:w-32 border-4 border-black rounded-lg shadow-lg flex items-center justify-center font-semibold text-sm bg-white`
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
              `h-20 w-20 sm:h-32 sm:w-32 border-4 border-black rounded-lg shadow-lg flex items-center justify-center font-semibold text-sm bg-white`
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
              `h-20 w-20 sm:h-32 sm:w-32 border-4 border-black rounded-lg shadow-lg flex items-center justify-center font-semibold text-sm bg-white`
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
              `h-20 w-20 sm:h-32 sm:w-32 border-4 border-black rounded-lg shadow-lg flex items-center justify-center font-semibold text-sm bg-white`
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
              `h-20 w-20 sm:h-32 sm:w-32 border-4 border-black rounded-lg shadow-lg flex items-center justify-center font-semibold text-sm bg-white`
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
              `h-20 w-20 sm:h-32 sm:w-32 border-4 border-black rounded-lg shadow-lg flex items-center justify-center font-semibold text-sm bg-white`
            )}
          >
            <Image
              src={"/assets/home/logos/logo.svg"}
              alt={""}
              width={100}
              height={100}
            />
          </div>
        </div>
      </section>
      <section className="w-full bg-[#0b1c2d] relative isolate overflow-hidden">
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
          <ul className="grid grid-cols-4 pt-16 gap-8">
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
      <section className="w-full relative isolate overflow-hidden">
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
      </section>
      {/* <section id="integration" className="py-36">
        <div className="px-4 md:px-8 max-w-6xl justify-center items-center text-left sm:text-center flex flex-col mx-auto w-full space-y-8">
          <div className="flex flex-col space-y-4">
            <h3 className="text-5xl font-bold text-black text-center tracking-tight leading-tight">
              Any model, <span className="text-pink-500">any scale</span>
            </h3>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl">
              We support any provider and model, as well as fine-tuned models.
              All with sub millisecond latency and query times.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 md:justify-center w-full">
            <div className="relative isolate bg-white h-[32rem] w-full border-2 border-black shadow-sm rounded-xl flex justify-center items-center">
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
            <div className="overflow-hidden relative isolate bg-white h-[32rem] w-full border-2 border-black  shadow-sm rounded-xl flex justify-center items-center">
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
      </section> */}

      <Footer />
    </div>
  );
};

export default HomePageV3;
