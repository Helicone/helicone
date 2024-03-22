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
        "flex flex-col items-center text-center w-full px-2"
      )}
    >
      <Image
        src="/static/logo-clear.png"
        width={120}
        height={120}
        alt="Helicone Logo"
        className="rounded-xl"
      />
      <p className="text-2xl md:text-5xl font-semibold mt-4">
        Welcome to Helicone
      </p>
      <p className="text-md md:text-lg text-gray-500 font-light mt-5">
        The easiest way to monitor your LLM-powered applications at scale
      </p>
      <button
        onClick={nextStep}
        className="px-28 py-3 bg-gray-900 hover:bg-gray-700 dark:bg-gray-100 dark:hover:bg-gray-300 dark:text-black font-medium text-white rounded-xl mt-8"
      >
        Get Started
      </button>
    </div>
  );
};

export default GetStarted;
