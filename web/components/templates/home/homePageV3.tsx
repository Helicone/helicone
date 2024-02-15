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
    <div className="w-full bg-white h-screen antialiased">
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
      <section className="w-full max-w-6xl mx-auto pb-16">
        <div className="border-b border-gray-300 w-full flex justify-center gap-16 mx-auto">
          <ul className="w-fit flex items-center gap-16">
            <li className="flex items-center gap-2 pb-3 -mb-0.5 border-b-[3px] border-violet-700">
              <ChartPieIcon className="w-6 h-6 text-violet-700" />
              <p className="text-md font-bold">Monitoring</p>
            </li>
            <li className="flex items-center gap-2 py-1">
              <ArrowPathIcon className="w-6 h-6 text-green-500" />
              <p className="text-md font-medium">Gateway</p>
            </li>
            <li className="flex items-center gap-2 py-1">
              <ArrowPathIcon className="w-6 h-6 text-orange-500" />
              <p className="text-md font-medium">Instrumentation</p>
            </li>
            <li className="flex items-center gap-2 py-1">
              <ArrowPathIcon className="w-6 h-6 text-sky-500" />
              <p className="text-md font-medium">Customer Portal</p>
            </li>
            <li className="flex items-center gap-2 py-1">
              <ArrowPathIcon className="w-6 h-6 text-red-500" />
              <p className="text-md font-medium">Fine-Tuning</p>
            </li>
            <li className="flex items-center gap-2 py-1">
              <ArrowPathIcon className="w-6 h-6 text-black" />
              <p className="text-md font-medium">Evaluations</p>
            </li>
          </ul>
        </div>
        <div className="my-4 w-full rounded-lg bg-violet-500 h-96"></div>
      </section>
      <section className="w-full grid grid-cols-8 max-w-6xl mx-auto py-32 justify-between gap-8 sm:gap-16 text-left">
        <div className="w-full flex flex-col col-span-8 sm:col-span-4">
          <h3 className="mt-8 text-4xl md:text-5xl font-bold flex flex-col tracking-tighter leading-tight">
            Modern startups and enterprises use Helicone
          </h3>
          <p className="text-lg text-gray-600 md:leading-normal mt-4">
            Our startup customers love Helicone for its easy integration and
            powerful insights. Our enterprise customers love Helicone for its
            scalability and reliability.
          </p>
          <div className="flex items-center gap-4 mt-8">
            <Link
              href="/signup"
              className="flex items-center bg-gray-900 hover:bg-gray-700 whitespace-nowrap rounded-lg pl-3 pr-2 py-1.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              Get Started <ChevronRightIcon className="w-5 h-5 inline" />
            </Link>
            <Link
              href="/sales"
              className="font-semibold text-sm flex items-center"
            >
              Contact Sales <ChevronRightIcon className="w-5 h-5 inline" />
            </Link>
          </div>
        </div>
        <div className="w-fit h-fit mt-16 sm:mt-8 grid grid-cols-3 gap-8 relative col-span-8 sm:col-span-4">
          {[
            "/assets/home/logos/logo.svg",
            "/assets/home/logos/qawolf.png",
            "/assets/home/logos/upenn.png",
            "/assets/home/logos/carta.png",
            "/assets/home/logos/lex.svg",
            "/assets/home/logos/particl.png",
            "/assets/home/logos/mintlify.svg",
            "/assets/home/logos/onboard.png",
            "/assets/home/logos/autogpt.png",
          ].map((item, i) => (
            <div
              key={i}
              className={clsx(
                i === 1 && "rotate-12 translate-x-8 -translate-y-8",
                i === 2 && "translate-x-16 -translate-y-20",
                i === 5 && "-rotate-12 translate-x-8 -translate-y-8",
                `h-20 w-20 sm:h-28 sm:w-28 border-4 border-black rounded-lg shadow-lg flex items-center justify-center font-semibold text-sm bg-white`
              )}
            >
              <Image src={item} alt={""} width={80} height={80} />
            </div>
          ))}
        </div>
      </section>
      <section className="w-full bg-[#0e2337] relative isolate overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col space-y-4 py-24 h-full">
          <h3 className="text-5xl font-bold text-white text-center tracking-tighter leading-tight">
            Made by developers,{" "}
            <span className="text-cyan-400">for developers</span>
          </h3>
          <p className="text-gray-300 font-medium text-2xl leading-8 text-center">
            This is the easiest integration you will ever do. We promise
          </p>
          <div className="flex gap-4 flex-col space-y-4 pt-16 px-24">
            <Steps />
          </div>
        </div>
        <div className="-bottom-44 md:-bottom-64 items-center flex absolute md:-right-72 w-full justify-end">
          <Globe />
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePageV3;
