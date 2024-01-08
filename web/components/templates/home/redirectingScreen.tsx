import { useEffect, useState } from "react";
import { clsx } from "../../shared/clsx";
import LoadingAnimation from "../../shared/loadingAnimation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import Link from "next/link";

interface RedirectingScreenProps {}

const RedirectingScreen = (props: RedirectingScreenProps) => {
  const {} = props;

  const [loaded, setLoaded] = useState(false);

  const client = useSupabaseClient();

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 2000); // delay of 2s
    return () => clearTimeout(timer); // this will clear Timeout
    // when component unmount like in willComponentUnmount
  }, []);

  return (
    <div className="h-screen flex flex-col items-center gap-4 justify-center">
      <LoadingAnimation title="Redirecting you to your dashboard..." />
      <div
        className={clsx(
          `transition-all duration-700 ease-in-out ${
            loaded ? "opacity-100" : "opacity-0"
          }`,
          "flex flex-col items-center text-center w-full px-2"
        )}
      >
        <p className="text-xl md:text-3xl font-semibold mt-8">
          Having trouble? Try signing out and signing back in.
        </p>
        <p className="text-md md:text-lg text-gray-700 font-light mt-4">
          Or, get in contact with us via our{" "}
          <Link href="https://discord.gg/2jZ6V7Yx" className="text-blue-500">
            Discord
          </Link>{" "}
          or email us at{" "}
          <Link href="mailto:support@helicone.ai" className="text-blue-500">
            support@helicone.ai
          </Link>
        </p>
        <button
          onClick={() => {
            client.auth.signOut();
          }}
          className="px-28 py-3 bg-gray-900 hover:bg-gray-700 font-medium text-white rounded-xl mt-8"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default RedirectingScreen;
