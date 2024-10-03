import Enterprise from "@/components/templates/landing/enterprise";
import Faqs from "@/components/templates/landing/faqs";
import Features from "@/components/templates/landing/features";
import LandingFooterGraphic from "@/components/templates/landing/footer";
import Integrations from "@/components/templates/landing/integrations";
import OpenSource from "@/components/templates/landing/opensource";
import Platform from "@/components/templates/landing/platform";
import { ChevronRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import ExperimentsNotifHeader from "../components/templates/landing/experimentsnotifheader";

export default function Home() {
  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-between text-black px-[12px] pt-[24px] pb-[24px]">
        <div className="flex flex-col items-center justify-between max-w-6xl mx-auto">
          <header className="text-center flex flex-col space-y-4 pb-[32px] md:pb-40 pt-8 md:pt-12 max-w-6xl mx-auto ">
            <div className="flex flex-col space-y-4 mx-[12px]">
              {/* <div className="flex flex-col space-y-4 w-full md:items-center items-start">
                <Link
                  href="https://www.ycombinator.com/launches/I73-helicone-open-source-observability-platform-for-generative-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2.5 bg-gray-50 rounded-md px-3.5 py-2 text-sm font-medium text-gray-600"
                >
                  <span>Backed by</span>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-1.5"
                  >
                    <g clipPath="url(#clip0_24_57)">
                      <rect
                        width="24"
                        height="24"
                        rx="5.4"
                        fill="#FF5100"
                      ></rect>
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
                        <rect
                          width="24"
                          height="24"
                          rx="5.4"
                          fill="white"
                        ></rect>
                      </clipPath>
                    </defs>
                  </svg>
                  <span>Combinator</span>
                </Link>
              </div> */}

              <ExperimentsNotifHeader />

              <h1 className="text-4xl md:text-5xl font-bold md:pt-4 md:text-center md:mx-0 text-start">
                LLM-Observability for{" "}
                <span className="text-sky-500">Developers</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 md:text-center text-start md:self-center ">
                The open-source platform for logging, monitoring, and debugging.
              </p>

              {PhDate.getDate() != new Date().getDate() ? (
                <div className="pt-4 w-fit md:mx-auto self-start md:self-center ">
                  <Link
                    href="https://us.helicone.ai/signup?demo=true"
                    className="bg-sky-500 hover:bg-sky-600 ease-in-out duration-500 text-white border-[3px] border-sky-700 rounded-lg pl-6 pr-4 py-2  font-bold shadow-lg flex flex-row w-fit items-center gap-1 self-start md:self-center"
                  >
                    Try Demo
                    <ChevronRightIcon className="w-5 h-5 inline text-white" />
                  </Link>
                </div>
              ) : (
                <div className="flex gap-4 pt-4 w-full justify-center flex-col md:flex-row items-start md:items-center pl-6">
                  <Link
                    href="https://us.helicone.ai/signup?demo=true"
                    className="hidden md:flex bg-white hover:bg-gray-100 ease-in-out duration-500 text-black border-[3px] border-gray-300 rounded-lg px-6 py-2 font-bold shadow-lg items-center gap-1 w-fit"
                  >
                    Get a demo
                  </Link>
                  <Link
                    href="https://us.helicone.ai/signup"
                    className="bg-sky-500 hover:bg-sky-600 ease-in-out duration-500 text-white border-[3px] border-sky-700 rounded-lg pl-6 pr-4 py-2 font-bold shadow-lg flex w-fit items-center gap-1"
                  >
                    Start Building
                    <ChevronRightIcon className="w-5 h-5 inline text-white" />
                  </Link>
                </div>
              )}
            </div>

            <ul className="self-center md:flex-row md:gap-6 md:justify-center md:items-center px-4 pt-16 text-sm hidden md:flex w-fit">
              <li className="flex flex-col md:items-center items-start">
                <Link
                  href="https://www.ycombinator.com/launches/I73-helicone-open-source-observability-platform-for-generative-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2.5 bg-gray-50 rounded-md px-3.5 py-2 text-sm font-medium text-gray-600"
                >
                  <span>Backed by</span>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-1.5"
                  >
                    <g clipPath="url(#clip0_24_57)">
                      <rect
                        width="24"
                        height="24"
                        rx="5.4"
                        fill="#FF5100"
                      ></rect>
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
                        <rect
                          width="24"
                          height="24"
                          rx="5.4"
                          fill="white"
                        ></rect>
                      </clipPath>
                    </defs>
                  </svg>
                  <span>Combinator</span>
                </Link>
              </li>
              <li>
                <a
                  href="https://www.producthunt.com/posts/helicone-ai?embed=true&utm_source=badge-top-post-badge&utm_medium=badge&utm_souce=badge-helicone&#0045;ai"
                  target="_blank"
                >
                  <img
                    src="https://api.producthunt.com/widgets/embed-image/v1/top-post-badge.svg?post_id=475050&theme=neutral&period=daily"
                    alt="Helicone&#0032;AI - Open&#0045;source&#0032;LLM&#0032;Observability&#0032;for&#0032;Developers | Product Hunt"
                    width="185"
                    height="50"
                  />
                </a>
              </li>
              <li>
                <iframe
                  src="https://ghbtns.com/github-btn.html?user=helicone&repo=helicone&type=star&count=true"
                  width="150"
                  height="20"
                  title="GitHub"
                ></iframe>
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

          <ul className="flex md:hidden flex-col gap-[26px] md:gap-16 self-start pl-[12px] pt-[24px] ">
            <li className="text-gray-600 text-xl font-semibold">
              Ready for production level workloads
            </li>

            <li className="flex flex-col items-start justify-start space-y-3">
              <span className="text-gray-600 border-l-2 border-sky-500 pl-2 py-1 font-bold text-2xl">
                1,000
              </span>
              <span className="text-gray-600 pl-3 font-light">
                Requests processed per second
              </span>
            </li>

            <li className="flex flex-col items-start justify-start space-y-3">
              <span className="text-gray-600 border-l-2 border-sky-500 pl-2 py-1 font-bold text-2xl">
                1.2 billion
              </span>
              <span className="text-gray-600 pl-3 font-light">
                Total requests logged
              </span>
            </li>

            <li className="flex flex-col items-start justify-start space-y-3">
              <span className="text-gray-600 border-l-2 border-sky-500 pl-2 py-1 font-bold text-2xl">
                99.99%
              </span>
              <span className="text-gray-600 pl-3 font-light">Uptime</span>
            </li>
          </ul>

          <section
            id="logos"
            className="text-center flex flex-col space-y-4 pt-[24px] pb-[48px] max-w-6xl mx-auto w-full"
          >
            <h2 className="hidden md:block text-gray-600 text-lg md:text-xl text-start md:text-center">
              Trusted by the thousands of companies and developers.
            </h2>
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-[12px] md:gap-20 px-0 md:px-8 grayscale opacity-80 items-center">
              {(
                [
                  ["/static/filevine.webp", "filevine", 150, 150],
                  ["/static/qawolf.webp", "qawolf", 150, 150],
                  ["/static/mintlify.svg", "mintlify", 150, 150],
                  ["/static/greptile.png", "greptile", 150, 150],
                  ["/static/reworkd.svg", "reworkd", 150, 150],
                  ["/static/codegen.png", "codegen", 150, 150],
                  ["/static/sunrun.png", "sunrun", 150, 150],
                  ["/static/lex.png", "lex", 50, 70],
                ] as const
              ).map((src, index) => (
                <li
                  className="flex items-center justify-center p-[24px]"
                  key={index}
                >
                  <Image
                    src={src[0]}
                    alt={src[1]}
                    width={src[2]}
                    height={src[3]}
                  />
                </li>
              ))}
            </ul>
            <div className="grid grid-cols-4 gap-8"></div>
          </section>

          <section
            id="integrations"
            className="flex flex-col space-y-4 mt-[24px] mb-8 max-w-6xl mx-auto w-full"
          >
            <div className="flex flex-col space-y-2 md:text-center text-start p-[12px]">
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

          <section className="w-full flex flex-col max-w-6xl mx-auto space-y-4  pt-[24px] px-4">
            <h2 className="sr-only">
              One platform,{" "}
              <span className="text-sky-500">
                with all the essentials tools.
              </span>
            </h2>
            <Platform />
          </section>

          <section id="enterprise" className="mb-16 hidden ">
            <h2 className="sr-only">
              Get to production-quality{" "}
              <span className="text-violet-800">faster</span>
            </h2>
            <div className="px-4 md:px-8 max-w-6xl justify-center items-center text-left sm:text-center flex flex-col mx-auto w-full space-y-8">
              <Enterprise />
            </div>
          </section>

          <section className="flex flex-col space-y-4 w-full items-center  mt-[48px] mb-[48px] md:pt-[100px] md:mb-[60px]">
            <Features />
          </section>

          <section className="flex flex-col space-y-4 pb-2 w-full items-center">
            <OpenSource />
          </section>

          <section className="flex flex-col py-2 items-start px-[12px] pb-[24px] w-full mditems-center md:max-w-[1000px]">
            <div className="flex flex-row pb-2 justify-between gap-2 w-fit items-center border-2 border-gray-200 rounded-full p-1.5 py-1">
              <Image
                src="/static/greptile-clear.svg"
                alt="Greptile Logo"
                width={30}
                height={30}
              />
              <XMarkIcon className="w-4 h-4" />
              <Image
                src="/static/logo-clear.svg"
                alt="Helicone Logo"
                width={30}
                height={30}
              />
            </div>

            <p className="text-gray-500 italic mt-8 text-lg">
              {'"'}We&apos;re spending the weekend combing through logs to
              improve our core system and slowly realizing just how unbelievably
              powerful Helicone is. Without it, this would take 10-12X longer
              and be much more draining. It&apos;s so, so good.{'"'}
            </p>
            <div className="w-1/3 mt-6">
              <p className="text-black font-bold">Daksh Gupta </p>
              <p className=" text-gray-500 whitespace-nowrap">
                Founder, Greptile
              </p>
            </div>
          </section>

          <section className="flex flex-col md:mt-32 md:my-0 w-full items-center px-[12px] pt-[24px] pb-[24px]">
            <Faqs />
          </section>
        </div>
      </main>
      <div className="hidden md:block">
        <LandingFooterGraphic />
      </div>
    </>
  );
}

const PhDate = new Date("2024-08-20T07:00:00.000Z");
