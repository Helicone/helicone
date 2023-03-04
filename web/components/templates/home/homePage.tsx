/* eslint-disable @next/next/no-img-element */
/*
  This example requires some changes to your config:
  
  ```
  // tailwind.config.js
  module.exports = {
    // ...
    plugins: [
      // ...
      require('@tailwindcss/forms'),
    ],
  }
  ```
*/
import { StarIcon } from "@heroicons/react/20/solid";
import AdvancedAnalytics from "./AdvancedAnalytics";
import { useRouter } from "next/router";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { DEMO_EMAIL } from "../../../lib/constants";
import Details from "./detailsV2";
import BasePageV2 from "../../shared/layout/basePageV2";
import OnboardingButton from "../../shared/auth/onboardingButton";
import { useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const supabaseClient = useSupabaseClient();
  const [demoLoading, setDemoLoading] = useState(false);

  return (
    <>
      <BasePageV2>
        <div className="relative">
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gray-100" />
          <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="relative shadow-xl sm:overflow-hidden sm:rounded-2xl">
              <div className="absolute inset-0">
                <img
                  className="h-full w-full object-cover"
                  src="/assets/landscape.webp"
                  alt="People working on laptops"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-sky-500 to-indigo-400 mix-blend-multiply" />
              </div>
              <div className="relative pt-12 pb-8 px-6 sm:pt-24 sm:pb-16 lg:pt-28 lg:pb-20 lg:px-8">
                <h1 className="text-center text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                  <span className="block text-white">
                    Observability for your
                  </span>
                  <span className="block text-sky-100">GPT-3 application</span>
                </h1>
                <p className="mx-auto mt-6 max-w-lg text-center text-xl text-indigo-100 sm:max-w-3xl">
                  Track usage, costs, and latency metrics with one line of code.
                  We&apos;re an open-source observability platform that helps
                  you better understand your GPT-3 application.
                </p>
                <div className="mx-auto mt-10 max-w-sm sm:flex sm:flex-col sm:max-w-none sm:justify-center">
                  <div className="space-y-4 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5 sm:space-y-0">
                    <OnboardingButton
                      full
                      variant="secondary"
                      title={"Get Started"}
                    />
                    <button
                      onClick={() => {
                        setDemoLoading(true);
                        supabaseClient.auth.signOut().then(() => {
                          supabaseClient.auth
                            .signInWithPassword({
                              email: DEMO_EMAIL,
                              password: "valyrdemo",
                            })
                            .then((res) => {
                              router.push("/dashboard").then(() => {
                                setDemoLoading(false);
                              });
                            });
                        });
                      }}
                      className="flex w-full items-center justify-center rounded-md border border-transparent bg-sky-500 bg-opacity-80 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-opacity-70 sm:px-8"
                    >
                      {demoLoading ? (
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            stroke-width="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8H4z"
                          />
                        </svg>
                      ) : (
                        "View Demo"
                      )}
                    </button>
                  </div>
                  <div className="bottom-0 w-full justify-center flex mx-auto text-white mt-12">
                    <p className="text-xl font-semibold">
                      Backed by{" "}
                      <span className="text-orange-500">Y Combinator</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alternating Feature Sections */}
        <Details />

        {/* Stats section */}
        <AdvancedAnalytics />

        {/* CTA Section */}
        <div className="bg-white">
          <div className="mx-auto max-w-4xl py-16 px-6 sm:py-24 lg:flex lg:max-w-7xl lg:items-center lg:justify-between lg:px-8">
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              <span className="block">We&apos;re Open Source!</span>
              <span className="-mb-1 hidden sm:block bg-gradient-to-r from-sky-500 to-indigo-400 bg-clip-text pb-1 text-transparent">
                View our repo and join our community
              </span>
              <span className="-mb-1 block sm:hidden bg-gradient-to-r from-sky-500 to-indigo-400 bg-clip-text pb-1 text-transparent">
                Join our community
              </span>
            </h2>
            <div className="mt-6 space-y-4 sm:flex sm:space-y-0 sm:space-x-5">
              <a
                href="https://github.com/Helicone/helicone"
                target="_blank"
                rel="noreferrer"
                className="flex flex-row items-center justify-center rounded-md border border-transparent bg-gradient-to-r from-sky-500 to-indigo-400 bg-origin-border px-4 py-3 text-base font-medium text-white shadow-sm hover:from-sky-600 hover:to-indigo-500"
              >
                Star us on GitHub
                <StarIcon className="h-4 w-4 ml-1 text-yellow-400 animate-pulse" />
              </a>
              <a
                href="https://discord.gg/zsSTcH2qhG"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center rounded-md border border-transparent bg-sky-100 px-4 py-3 text-base font-medium text-sky-800 shadow-sm hover:bg-sky-200"
              >
                Join Discord
              </a>
            </div>
          </div>
        </div>
      </BasePageV2>
    </>
  );
}
