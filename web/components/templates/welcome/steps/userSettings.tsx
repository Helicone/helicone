import { useEffect, useState } from "react";
import { clsx } from "../../../shared/clsx";
import Image from "next/image";
import { useTheme } from "next-themes";

interface UserSettingsProps {
  nextStep: () => void;
}

const UserSettings = (props: UserSettingsProps) => {
  const { nextStep } = props;

  const [loaded, setLoaded] = useState(false);

  const { theme, setTheme } = useTheme();

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
        "flex flex-col items-center text-center w-full px-2 space-y-4"
      )}
    >
      <p className="text-2xl md:text-5xl font-semibold">Select your theme</p>
      <div className="flex flex-col md:flex-row gap-4 py-8">
        <button
          onClick={() => setTheme("light")}
          className={clsx(
            theme === "light" ? "ring-2 ring-sky-500" : "",
            "rounded-lg border border-gray-300 flex flex-col items-center justify-center p-4 space-y-4 bg-white"
          )}
        >
          <Image
            src={"/assets/welcome/light.png"}
            alt={"Light Mode"}
            width={250}
            height={250}
          />
          <p className="font-semibold text-black">Light</p>
        </button>
        <button
          onClick={() => setTheme("dark")}
          className={clsx(
            theme === "dark" ? "ring-2 ring-sky-500" : "",
            "rounded-lg border border-gray-300 flex flex-col items-center justify-center p-4 space-y-4 bg-black"
          )}
        >
          <Image
            src={"/assets/welcome/dark.png"}
            alt={"Dark Mode"}
            width={250}
            height={250}
          />
          <p className="font-semibold text-white">Dark</p>
        </button>
      </div>

      <button
        onClick={nextStep}
        className="px-28 py-3 bg-gray-900 hover:bg-gray-700 dark:bg-gray-100 dark:hover:bg-gray-300 dark:text-black font-medium text-white rounded-xl mt-8"
      >
        Next
      </button>
    </div>
  );
};

export default UserSettings;
