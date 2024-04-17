import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useEffect, useRef, useState } from "react";
import { Database } from "../../../supabase/database.types";
import { DEMO_EMAIL } from "../../../lib/constants";
import NavBarV2 from "../../layout/navbar/navBarV2";
import Footer from "../../layout/footer";
import { ChevronRightIcon, HeartIcon } from "@heroicons/react/20/solid";
import Image from "next/image";
import { clsx } from "../../shared/clsx";
import Link from "next/link";
import {
  BuildingOffice2Icon,
  CodeBracketSquareIcon,
  CubeIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import gsap from "gsap";
import Platform from "./components/platform";
import { Disclosure } from "@headlessui/react";
import { useLocalStorage } from "../../../services/hooks/localStorage";
import { DiffHighlight } from "../welcome/diffHighlight";
import useNotification from "../../shared/notification/useNotification";
import Enterprise from "./components/enterprise";
import Globe from "./globe";

interface HomePageProps {}

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

const HomePage = (props: HomePageProps) => {
  const {} = props;

  const [demoLoading, setDemoLoading] = useState(false);

  const { setNotification } = useNotification();
  const user = useUser();
  const [showStars, setShowStars] = useLocalStorage("showStars", true);

  const supabaseClient = useSupabaseClient<Database>();

  // Create a ref for the hero text
  const heroTextRef = useRef<HTMLDivElement>(null);
  const subTextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const animationDelay = setTimeout(() => {
      if (subTextRef.current) {
        subTextRef.current.classList.remove("invisible", "opacity-0");
        gsap.from(subTextRef.current, {
          duration: 2,
          autoAlpha: 0,
          y: -50,
          ease: "power3.out",
        });
      }
    }, 300);

    return () => clearTimeout(animationDelay);
  }, []);

  useEffect(() => {
    if (heroTextRef.current) {
      gsap.from(heroTextRef.current.children, {
        duration: 0.8,
        y: 50,
        opacity: 0,
        stagger: 0.2, // Stagger the animation for each child
        ease: "power3.out",
      });
    }
  }, []);

  if (!demoLoading && user?.email === DEMO_EMAIL) {
    supabaseClient.auth.signOut();
  }

  return (
    <div className="w-full bg-[#f8feff] h-full antialiased relative">
      <NavBarV2 />
      <header
        style={{
          backgroundImage: `url('/static/hero-bg.svg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        className="pb-32"
      >
        <div className="relative w-full flex flex-col space-y-4 mx-auto max-w-6xl h-full py-16 sm:pt-32  items-center text-center px-2 sm:px-2 lg:px-0">
          <div className="-mt-4 text-xs mx-auto flex flex-col sm:flex-row sm:divide-x-2 gap-[14px] justify-center items-center divide-gray-300 opacity-75 w-fit px-4 pb-4 rounded-xl">
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
          <h1
            ref={heroTextRef}
            className="font-mono text-4xl sm:text-6xl block font-bold w-full h-full tracking-tight text-center items-center sm:leading-[1]"
          >
            <span>Observability Platform for</span>{" "}
            <span className="text-sky-500">LLM-developers</span>
          </h1>
          <p
            ref={subTextRef}
            className="text-gray-700 font-medium text-md sm:text-2xl sm:leading-7 invisible opacity-0 font-[Roboto Mono]"
          >
            Meet the lightweight, yet powerful platform purpose-built for
            Generative AI
          </p>
          <div className="flex items-center gap-4 pt-4">
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
        </div>
        <div className="flex gap-4 flex-col justify-center items-center space-y-4 pb-32">
          <div className="hidden md:flex flex-col space-y-4 w-[44rem]">
            <DiffHighlight
              code={`
from openai import OpenAI

client = OpenAI(
  api_key={{OPENAI_API_KEY}},
  base_url="http://oai.hconeai.com/v1", 
  default_headers= { 
    "Helicone-Auth": f"Bearer {{HELICONE_API_KEY}}",
  }
)
        `}
              language={"python"}
              newLines={[4, 6]}
              oldLines={[]}
              minHeight={false}
              textSize="lg"
            />
          </div>
          <div className="flex md:hidden flex-col space-y-4 w-full px-4">
            <DiffHighlight
              code={`
from openai import OpenAI

client = OpenAI(
  api_key={{OPENAI_API_KEY}},
  base_url="http://oai.hconeai.com/v1", 
  default_headers= { 
    "Helicone-Auth": f"Bearer {{HELICONE_API_KEY}}",
  }
)
        `}
              language={"python"}
              newLines={[4, 6]}
              oldLines={[]}
              minHeight={false}
              textSize="sm"
            />
          </div>
        </div>

        <div className="w-full flex flex-col max-w-6xl mx-auto space-y-4 px-4 py-32">
          <div className="flex flex-col w-full items-center text-center">
            <h3 className="text-xl sm:text-3xl font-bold text-black text-center tracking-tight leading-tight">
              Trusted by thousands of{" "}
              <span className=" hidden sm:inline">
                startups and enterprises
              </span>
              <span className=" inline sm:hidden">companies</span>
            </h3>
            <p className="text-gray-900 font-medium text-md sm:text-lg sm:leading-9">
              <span className="hidden sm:inline">Helicone is built</span>
              <span className="inline sm:hidden">Built</span> to scale with your
              business
              <span className="hidden sm:inline">, no matter the size.</span>
            </p>
          </div>
          <div className="flex flex-row sm:flex-col mx-auto px-4 sm:px-0 gap-8 sm:gap-0 w-full">
            <div className="flex flex-col sm:flex-row justify-between w-full mx-auto max-w-4xl">
              <div
                className={clsx(`h-32 w-32 flex items-center justify-center`)}
              >
                <Image
                  src={"/assets/home/logos/logo.svg"}
                  alt={""}
                  width={400}
                  height={400}
                />
              </div>{" "}
              <div
                className={clsx(`h-32 w-32 flex items-center justify-center`)}
              >
                <Image
                  src={"/assets/home/logos/qawolf.png"}
                  alt={""}
                  width={400}
                  height={400}
                />
              </div>{" "}
              <div
                className={clsx(`h-32 w-32 flex items-center justify-center`)}
              >
                <Image
                  src={"/assets/home/logos/carta.png"}
                  alt={""}
                  width={100}
                  height={100}
                />
              </div>{" "}
              <div
                className={clsx(`h-32 w-32 flex items-center justify-center`)}
              >
                <Image
                  src={"/assets/home/logos/reworkd.png"}
                  alt={""}
                  width={60}
                  height={60}
                />
              </div>{" "}
            </div>
            <div className="flex flex-col sm:flex-row justify-between w-full mx-auto max-w-4xl">
              <div
                className={clsx(`h-28 w-32 flex items-center justify-center`)}
              >
                <Image
                  src={"/assets/home/logos/lex.svg"}
                  alt={""}
                  width={60}
                  height={60}
                />
              </div>{" "}
              <div
                className={clsx(`h-28 w-32 flex items-center justify-center`)}
              >
                <Image
                  src={"/assets/home/logos/particl.png"}
                  alt={""}
                  width={120}
                  height={120}
                />
              </div>{" "}
              <div
                className={clsx(`h-28 w-32 flex items-center justify-center`)}
              >
                <Image
                  src={"/assets/home/logos/mintlify.svg"}
                  alt={""}
                  width={400}
                  height={400}
                />
              </div>{" "}
              <div
                className={clsx(`h-28 w-32 flex items-center justify-center`)}
              >
                <Image
                  src={"/assets/home/logos/onboard.png"}
                  alt={""}
                  width={700}
                  height={700}
                />
              </div>
            </div>
          </div>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-4 gap-16 mx-auto max-w-6xl pt-32 pb-8 px-4">
          <li className="col-span-1 flex items-start space-x-2">
            <div>
              <CodeBracketSquareIcon className="w-8 h-8 text-sky-700" />
            </div>
            <div className="flex flex-col space-y-1">
              <h2 className="text-xl font-bold text-black">Any Model</h2>
              <p className="text-md text-gray-700 font-medium">
                We support models from OpenAI, Claude, Gemini, and more.
              </p>
            </div>
          </li>
          <li className="col-span-1 flex items-start space-x-2">
            <div>
              <BuildingOffice2Icon className="w-8 h-8 text-sky-700" />
            </div>
            <div className="flex flex-col space-y-1">
              <h2 className="text-xl font-bold text-black">Any Scale</h2>
              <p className="text-md text-gray-700 font-medium">
                Log millions of requests per second with no latency impact.
              </p>
            </div>
          </li>
          <li className="col-span-1 flex items-start space-x-2">
            <div>
              <CubeIcon className="w-8 h-8 text-sky-700" />
            </div>
            <div className="flex flex-col space-y-1">
              <h2 className="text-xl font-bold text-black">Async Packages</h2>
              <p className="text-md text-gray-700 font-medium">
                We offer async packages for all major languages and frameworks.
              </p>
            </div>
          </li>
          <li className="col-span-1 flex items-start space-x-2">
            <div>
              <ShieldCheckIcon className="w-8 h-8 text-sky-700" />
            </div>
            <div className="flex flex-col space-y-1">
              <h2 className="text-xl font-bold text-black">
                Fully Open-Source
              </h2>
              <p className="text-md text-gray-700 font-medium">
                Deploy Helicone on-prem for maximum security.
              </p>
            </div>
          </li>
        </ul>
      </header>

      <section className="w-full flex flex-col max-w-6xl mx-auto space-y-4 py-32 px-4">
        <Platform />
      </section>
      <section id="enterprise" className="py-36">
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
                  transparency. Helicone is fully open-source and available for
                  anyone to use.
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
                      <span className="text-cyan-400">Frontend:</span> React,
                      Next.js, TailwindCSS
                    </li>
                    <li>
                      <span className="text-cyan-400">Backend:</span> Supabase,
                      Clickhouse, Postgres, Node, Express
                    </li>
                    <li>
                      <span className="text-cyan-400">Infrastructure:</span>{" "}
                      Cloudflare, AWS, Vercel
                    </li>
                  </ul>
                </div>
                <ul className="py-4 flex flex-col space-y-8">
                  <li className="flex items-start space-x-2">
                    <div>
                      <ShieldCheckIcon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div className="flex flex-col space-y-1 -mt-0.5">
                      <h2 className="text-sm md:text-lg font-bold text-white">
                        Interested in deploying Helicone on-prem?
                      </h2>
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
                      <h2 className="text-sm md:text-lg font-bold text-white">
                        Want to ask the team a question?
                      </h2>
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
                      <h2 className="text-sm md:text-lg font-bold text-white">
                        Want to contribute or star us on Github?
                      </h2>
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

        <div className="-bottom-44 md:-bottom-72 items-center flex absolute md:-right-1/3 w-full justify-end opacity-20 -z-10">
          <Globe />
        </div>
      </section>

      <section id="faq" className="bg-inherit py-36">
        <div className="mx-auto px-4 md:px-8 max-w-6xl">
          <div className="flex flex-col space-y-4  text-left sm:text-center ">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tighter leading-tight">
              Frequently asked questions
            </h2>
          </div>
          <dl className="mt-10 flex flex-col space-y-4">
            {faqs.map((faq) => (
              <Disclosure as="div" key={faq.question} className="">
                {({ open }) => (
                  <div className="border-2 border-black rounded-xl p-6">
                    <dt>
                      <Disclosure.Button className="flex w-full items-start justify-between text-left text-gray-900">
                        <span className="text-lg font-bold leading-7">
                          {faq.question}
                        </span>
                        <span className="ml-6 flex h-7 items-center">
                          {open ? (
                            <ChevronRightIcon
                              className="h-6 w-6 rotate-90 transform transition-transform duration-300 ease-in-out"
                              aria-hidden="true"
                            />
                          ) : (
                            <ChevronRightIcon
                              className="h-6 w-6 transform transition-transform duration-300 ease-in-out"
                              aria-hidden="true"
                            />
                          )}
                        </span>
                      </Disclosure.Button>
                    </dt>
                    <Disclosure.Panel as="dd" className="mt-4 pr-12">
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
      {/* {showStars && (
        <div className="bg-emerald-500 text-xs rounded-3xl w-fit px-4 py-2 bottom-8 mx-auto flex sticky z-50 justify-between items-center gap-4">
          <p className="text-white font-mono font-bold tracking-tighter">
            Star us on Github
          </p>
          <Link
            className="flex flex-row items-center text-xs font-semibold ring-1 ring-gray-300"
            href={"https://github.com/Helicone/helicone"}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="bg-gray-300 px-2 py-1 flex items-center ">
              <svg
                fill="currentColor"
                viewBox="0 0 24 24"
                width="16"
                height="16"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Star</span>
            </div>

            <div className="bg-gray-100 px-2 py-1">1.2k</div>
          </Link>
          <button
            onClick={() => {
              setShowStars(false);
            }}
          >
            <XMarkIcon className="h-4 w-4 text-white" />
          </button>
        </div>
      )} */}
      <Footer />
    </div>
  );
};

export default HomePage;
