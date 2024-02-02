import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { Database } from "../../../supabase/database.types";
import { DEMO_EMAIL } from "../../../lib/constants";
import GridBackground from "../../layout/public/gridBackground";
import NavBarV2 from "../../layout/navbar/navBarV2";
import Footer from "../../layout/footer";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import Image from "next/image";
import { clsx } from "../../shared/clsx";

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
        <header className="w-full max-w-5xl mx-auto h-full py-32 justify-between gap-0 grid grid-cols-8">
          <div className="w-full flex flex-col col-span-5 space-y-8">
            <h3 className="text-8xl font-semibold w-full h-full flex flex-col tracking-tighter leading-[1]">
              Generative AI
              <div>Platform</div>
              <div>for the future</div>
            </h3>
            <p className="text-gray-600 font-medium text-xl w-5/6 leading-8">
              Meet the lightweight, yet powerful platform purpose-built for the
              next generation of AI applications. Thousands of startups and
              enterprises use Helicone today.
            </p>
            <div className="flex items-center gap-4">
              <button className="flex items-center bg-gray-900 hover:bg-gray-700 whitespace-nowrap rounded-lg pl-3 pr-2 py-1.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500">
                Get Started <ChevronRightIcon className="w-5 h-5 inline" />
              </button>
              <button className="font-semibold text-sm flex items-center">
                Contact Sales <ChevronRightIcon className="w-5 h-5 inline" />
              </button>
            </div>
          </div>
          {/* <div className="w-full flex flex-col col-span-5 space-y-8">
            <h3 className="text-8xl font-semibold w-full h-full flex flex-col tracking-tighter leading-[1]">
              Lightweight
              <div>Generative AI</div>
              <div>Platform</div>
            </h3>
            <p className="text-gray-600 font-medium text-xl w-5/6 leading-8">
              Meet the lightweight, yet powerful platform purpose-built for the
              next generation of AI applications. Thousands of startups and
              enterprises use Helicone today.
            </p>
            <div className="flex items-center gap-4">
              <button className="flex items-center bg-gray-900 hover:bg-gray-700 whitespace-nowrap rounded-lg pl-3 pr-2 py-1.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500">
                Get Started <ChevronRightIcon className="w-5 h-5 inline" />
              </button>
              <button className="font-semibold text-sm flex items-center">
                Contact Sales <ChevronRightIcon className="w-5 h-5 inline" />
              </button>
            </div>
          </div> */}

          <div className="w-fit h-fit mt-8 col-span-3 grid grid-cols-3 gap-8 relative">
            {/* get an array from 1-9 */}
            {[
              "Dashboards",
              "Cache",
              "Evaluations",
              "Alerts",
              "Moderation",
              "Fine-Tuning",
              "Feedback",
              "Rate-Limiting",
              "ETL",
            ].map((item, i) => (
              <div
                key={i}
                className={clsx(
                  i === 1 && "rotate-12 translate-x-8 -translate-y-8",
                  i === 2 && "translate-x-16 -translate-y-20",
                  i === 5 && "-rotate-12 translate-x-8 -translate-y-8",
                  `h-28 w-28 border-4 border-black rounded-lg shadow-lg flex items-center justify-center font-semibold text-sm bg-white`
                )}
              >
                {item}
              </div>
            ))}
            <div className="w-full text-center font-semibold text-xs p-1 text-sky-500 border border-sky-500 rounded-full">
              Monitor
            </div>
            <div className="w-full text-center font-semibold text-xs p-1 text-sky-500 border border-sky-500 rounded-full">
              Gateway
            </div>
            <div className="w-full text-center font-semibold text-xs p-1 text-sky-500 border border-sky-500 rounded-full">
              Instrument
            </div>
          </div>
        </header>
      </GridBackground>
      <div className="w-full mx-auto max-w-5xl pb-32">
        <div className="w-full grid grid-cols-4 items-center gap-x-8 gap-y-10 sm:gap-x-10 lg:mx-0 lg:max-w-none">
          <Image
            className="col-span-2 max-h-8 w-full object-contain lg:col-span-1"
            src="/assets/home/logos/logo.svg"
            alt="filevine"
            width={158}
            height={48}
          />
          <Image
            className="col-span-2 max-h-20 w-full object-contain lg:col-span-1"
            src="/assets/home/logos/upenn.png"
            alt="upenn"
            width={400}
            height={100}
          />
          <Image
            className="col-span-2 max-h-10 w-full object-contain lg:col-span-1"
            src="/assets/home/logos/carta.png"
            alt="carta"
            width={400}
            height={100}
          />
          <Image
            className="col-span-2 max-h-12 w-full object-contain lg:col-span-1"
            src="/assets/home/logos/lex.svg"
            alt="lex"
            width={158}
            height={48}
          />
          <Image
            className="col-span-2 max-h-8 w-full object-contain lg:col-span-1"
            src="/assets/home/logos/particl.png"
            alt="particle"
            width={158}
            height={48}
          />
          <Image
            className="col-span-2 max-h-8 w-full object-contain lg:col-span-1"
            src="/assets/home/logos/qawolf.png"
            alt="qawolf"
            width={100}
            height={48}
          />
          <Image
            className="col-span-2 max-h-8 w-full object-contain lg:col-span-1"
            src="/assets/home/logos/mintlify.svg"
            alt="mintlify"
            width={125}
            height={48}
          />
          <Image
            className="col-span-2 max-h-20 w-full object-contain lg:col-span-1"
            src="/assets/home/logos/onboard.png"
            alt="onboard"
            width={300}
            height={100}
          />
        </div>
      </div>
      <div className="w-full mx-auto max-w-5xl pb-32 flex flex-col h-screen">
        <div className="flex flex-col">
          <div className="h-28 w-28 border-4 border-black rounded-sm flex items-center justify-center font-semibold text-lg bg-white">
            Monitor
          </div>
          <h2 className="text-2xl font-semibold mt-8">
            The{" "}
            <span className="md:border border-sky-600 border-dashed text-sky-600 md:py-1 md:px-2">
              easiest
            </span>{" "}
            way to monitor your application at{" "}
            <span className="md:border border-sky-600 border-dashed text-sky-600 md:py-1 md:px-2">
              scale
            </span>
          </h2>
          <p className="text-gray-500 font-medium text-md max-w-2xl mt-2">
            With only two lines of code, Helicone provides meaningful insights
            that help you understand your applications performance in real-time.
          </p>
        </div>
      </div>
      <div className="w-full mx-auto max-w-5xl pb-32 flex flex-col h-screen">
        <div className="flex flex-col">
          <div className="h-28 w-28 border-4 border-black rounded-sm flex items-center justify-center font-semibold text-lg bg-white">
            Gateway
          </div>
          <h2 className="text-2xl font-semibold mt-8">
            The{" "}
            <span className="md:border border-sky-600 border-dashed text-sky-600 md:py-1 md:px-2">
              easiest
            </span>{" "}
            way to monitor your application at{" "}
            <span className="md:border border-sky-600 border-dashed text-sky-600 md:py-1 md:px-2">
              scale
            </span>
          </h2>
          <p className="text-gray-500 font-medium text-md max-w-2xl mt-2">
            With only two lines of code, Helicone provides meaningful insights
            that help you understand your applications performance in real-time.
          </p>
        </div>
      </div>
      <div className="w-full mx-auto max-w-5xl pb-32 flex flex-col h-screen">
        <div className="flex flex-col">
          <div className="h-28 w-28 border-4 border-black rounded-sm flex items-center justify-center font-semibold text-lg bg-white">
            Instrument
          </div>
          <h2 className="text-2xl font-semibold mt-8">
            The{" "}
            <span className="md:border border-sky-600 border-dashed text-sky-600 md:py-1 md:px-2">
              easiest
            </span>{" "}
            way to monitor your application at{" "}
            <span className="md:border border-sky-600 border-dashed text-sky-600 md:py-1 md:px-2">
              scale
            </span>
          </h2>
          <p className="text-gray-500 font-medium text-md max-w-2xl mt-2">
            With only two lines of code, Helicone provides meaningful insights
            that help you understand your applications performance in real-time.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HomePageV3;
