import { useEffect, useState } from "react";
import { clsx } from "../../../shared/clsx";
import Image from "next/image";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";

interface UserSettingsProps {
  nextStep: () => void;
}

const UserSettings = (props: UserSettingsProps) => {
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
      <p className="text-2xl md:text-5xl font-semibold mt-8">
        Select your theme
      </p>
      <div className="flex flex-col md:flex-row gap-4 mt-8">
        <div className="flex flex-col items-center justify-center gap-2 border border-gray-300">
          <SunIcon className="w-36 h-36 text-black" />
        </div>
        <div className="flex flex-col items-center justify-center gap-2 border border-gray-300">
          <MoonIcon className="w-36 h-36 text-black" />
        </div>
      </div>

      <button
        onClick={nextStep}
        className="px-28 py-3 bg-gray-900 hover:bg-gray-700 font-medium text-white rounded-xl mt-8"
      >
        Next
      </button>
    </div>
  );
};

export default UserSettings;
