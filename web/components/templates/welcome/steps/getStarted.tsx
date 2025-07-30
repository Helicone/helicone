import Image from "next/image";
import { useEffect, useState } from "react";
import { clsx } from "../../../shared/clsx";

interface GetStartedProps {
  nextStep: () => void;
}

const GetStarted = (props: GetStartedProps) => {
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
        "flex w-full flex-col items-center px-2 text-center",
      )}
    >
      <Image
        src="/static/logo-clear.png"
        width={120}
        height={120}
        alt="Helicone Logo"
        className="rounded-xl"
      />
      <p className="mt-4 text-2xl font-semibold md:text-5xl">
        Welcome to Helicone
      </p>
      <p className="text-md mt-5 font-light text-gray-500 md:text-lg">
        The easiest way to monitor your LLM-powered applications at scale
      </p>
      <button
        onClick={nextStep}
        className="mt-8 rounded-xl bg-gray-900 px-28 py-3 font-medium text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-black dark:hover:bg-gray-300"
      >
        Get Started
      </button>
    </div>
  );
};

export default GetStarted;
