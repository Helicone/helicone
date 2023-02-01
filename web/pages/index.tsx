import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  ArrowDownIcon,
  ChevronRightIcon,
  MinusIcon,
  PlusIcon,
} from "@heroicons/react/24/solid";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { useUser } from "@supabase/auth-helpers-react";
import { GetServerSidePropsContext } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import Advanced from "../components/shared/advanced";
import NavBar from "../components/shared/navBar";
import Test from "../components/shared/test";
import HomePage from "../components/templates/home/homePage";
import { redirectIfLoggedIn } from "../lib/redirectIdLoggedIn";

interface HomeProps {}

const Home = (props: HomeProps) => {
  const {} = props;
  const [showBanner, setShowBanner] = useState(true);

  return (
    <>
      {showBanner && (
        <div className="relative bg-orange-600">
          <div className="mx-auto max-w-7xl py-3 px-3 sm:px-6 lg:px-8">
            <div className="pr-16 sm:px-16 sm:text-center">
              <p className="font-medium text-white">
                <span className="md:hidden">We partnered with YC</span>
                <span className="hidden md:inline">
                  Big news! We&apos;ve partnered with YCombinator
                </span>
                <span className="inline-block ml-2">
                  <a href="#" className="font-bold text-white underline">
                    Learn more
                    <span aria-hidden="true"> &rarr;</span>
                  </a>
                </span>
              </p>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-start pt-1 pr-1 sm:items-start sm:pt-1 sm:pr-2">
              <button
                onClick={() => setShowBanner(false)}
                type="button"
                className="flex rounded-md p-2 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-white"
              >
                <span className="sr-only">Dismiss</span>
                <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
      <HomePage />
      <Test />
      <Advanced />
    </>
  );
};

export default Home;

export const getServerSideProps = redirectIfLoggedIn("/dashboard", async () => {
  return {
    props: {},
  };
});
