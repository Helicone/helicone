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
        "flex w-full flex-col items-center space-y-4 px-2 text-center",
      )}
    >
      <p className="text-2xl font-semibold md:text-5xl">Select your theme</p>
      <div className="flex flex-col gap-4 py-8 md:flex-row">
        <button
          onClick={() => setTheme("light")}
          className={clsx(
            theme === "light" ? "ring-2 ring-sky-500" : "",
            "flex flex-col items-center justify-center space-y-4 rounded-lg border border-gray-300 bg-white p-4",
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
            "flex flex-col items-center justify-center space-y-4 rounded-lg border border-gray-300 bg-black p-4",
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
        className="mt-8 rounded-xl bg-gray-900 px-28 py-3 font-medium text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-black dark:hover:bg-gray-300"
      >
        Next
      </button>
    </div>
  );
};

export default UserSettings;
