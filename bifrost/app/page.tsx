import Integrations from "@/components/templates/landingPage/integrations";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 text-black">
      <header className="text-center flex flex-col space-y-4 py-32 max-w-6xl mx-auto">
        <p>Backed by YCombinator</p>
        <h1 className="text-4xl md:text-5xl font-bold">
          LLM-Observability for <span className="text-sky-500">Developers</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600">
          The open-source platform for logging, monitoring, and debugging.
        </p>
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
            <span className="text-gray-600">Industry-leading query times</span>
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
        className="text-center flex flex-col space-y-4 py-32 max-w-6xl mx-auto w-full"
      >
        <h2 className="text-gray-600 text-lg md:text-xl">
          Ready for real production workloads
        </h2>
        <ul className="flex items-center w-full justify-between px-16 pt-4">
          <li>
            <dl className="flex flex-col space-y-2">
              <dt className="font-bold text-5xl">15 million</dt>
              <dd className="text-sm text-gray-600 font-light">
                Requests per seconds
              </dd>
            </dl>
          </li>
          <li>
            <dl className="flex flex-col space-y-2">
              <dt className="font-bold text-5xl">15 million</dt>
              <dd className="text-sm text-gray-600 font-light">
                Requests per seconds
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
        <ul className="flex items-center w-full justify-center gap-32 px-8 pt-4">
          <li>
            <div className="h-8 w-16 bg-gray-300"></div>
          </li>
          <li>
            <div className="h-8 w-16 bg-gray-300"></div>
          </li>{" "}
          <li>
            <div className="h-8 w-16 bg-gray-300"></div>
          </li>{" "}
          <li>
            <div className="h-8 w-16 bg-gray-300"></div>
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
    </main>
  );
}
