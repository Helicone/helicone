import { CheckCircleIcon, MinusCircleIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { useEffect, useState } from "react";
import { clsx } from "../../../shared/clsx";

interface MethodForkProps {
  nextStep: () => void;
}

const PROXY_FEATURES = [
  "Easy Setup",
  "Custom Rate Limiting",
  "Bucket Caching",
  "Request Retries",
];

const ASYNC_FEATURES = ["Not on critical path", "0 Propagation Delay"];

const MethodFork = (props: MethodForkProps) => {
  const { nextStep } = props;

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 500); // delay of 500ms
    return () => clearTimeout(timer); // this will clear Timeout
    // when component unmount like in willComponentUnmount
  }, []);

  return (
    <div
      className={clsx(
        `transition-all duration-700 ease-in-out ${
          loaded ? "opacity-100" : "opacity-0"
        }`,
        "flex flex-col items-center text-center w-full px-2"
      )}
    >
      <p className="text-2xl md:text-5xl font-semibold mt-8">Proxy v. Async</p>
      <p className="text-md md:text-lg text-gray-700 font-light mt-5">
        Choose your preferred method of integration. Learn more in our{" "}
        <span>
          <Link
            href={"https://docs.helicone.ai/getting-started/proxy-vs-async"}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            docs
          </Link>
        </span>
        .
      </p>
      <div className="flex flex-row gap-8 mt-12">
        <div className="relative hover:bg-gray-300 hover:cursor-pointer h-full min-h-[15rem] pb-16 w-64 rounded-lg border border-gray-500 shadow-lg p-4 flex flex-col gap-2">
          <p className="text-gray-900 font-semibold text-2xl">Proxy</p>
          <ul className="text-left text-md leading-6 text-gray-600">
            {PROXY_FEATURES.map((feature, idx) => (
              <li
                key={idx}
                className="text-gray-700 mt-3 flex gap-x-3 items-center"
              >
                <CheckCircleIcon
                  className={clsx("text-green-600", "h-6 w-5 flex-none")}
                  aria-hidden="true"
                />
                {feature}
              </li>
            ))}
          </ul>
        </div>
        <div className="hover:bg-gray-300 hover:cursor-pointer h-full min-h-[15rem] pb-16 w-64 rounded-lg border border-gray-500 shadow-lg p-4 flex flex-col gap-2">
          <p className="text-gray-900 font-semibold text-2xl">Async</p>
          <ul className="text-left text-md leading-6 text-gray-600">
            {ASYNC_FEATURES.map((feature, idx) => (
              <li
                key={idx}
                className="text-gray-700 mt-3 flex gap-x-3 items-center"
              >
                <CheckCircleIcon
                  className={clsx("text-green-600", "h-6 w-5 flex-none")}
                  aria-hidden="true"
                />
                {feature}
              </li>
            ))}
            <li className="text-gray-700 mt-3 flex gap-x-3 items-center">
              <MinusCircleIcon
                className={clsx("text-gray-600", "h-6 w-5 flex-none")}
                aria-hidden="true"
              />
              Requires Package
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MethodFork;
