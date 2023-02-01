import { ChevronDoubleDownIcon } from "@heroicons/react/24/outline";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { Database } from "../../../supabase/database.types";
import BasePage from "../../shared/layout/basePage";
import Test from "../../shared/test";

interface HomePageProps {}

const HomePage = (props: HomePageProps) => {
  const {} = props;
  const router = useRouter();
  const user = useUser();
  const supabaseClient = useSupabaseClient<Database>();

  return (
    <BasePage>
      <div className="h-5/6 justify-center align-middle items-left flex flex-col space-y-4">
        <p className="text-4xl sm:text-5xl font-semibold">
          Observe your GPT-3 logs
        </p>
        <p className="text-2xl sm:text-3xl font-sans font-light">
          Track usage, costs, and latency metrics with{" "}
          <span className="font-bold">one</span> line of code
        </p>
        <div className="pt-8 flex flex-row sm:items-center justify-start gap-4">
          {user ? (
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-md bg-black px-3.5 py-1.5 text-base font-semibold leading-7 text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              View Dashboard
            </button>
          ) : (
            <>
              <button
                onClick={() => router.push("/onboarding")}
                className="rounded-md bg-black px-3.5 py-1.5 text-base font-semibold leading-7 text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Get started{" "}
                <span className="hidden sm:inline-flex">
                  for free in less than 3 minutes
                </span>
              </button>
              <button
                onClick={() => {
                  supabaseClient.auth.signOut().then(() => {
                    supabaseClient.auth
                      .signInWithPassword({
                        email: "heliconedemo@gmail.com",
                        password: "heliconedemo",
                      })
                      .then((res) => {
                        console.log(res);
                        router.push("/dashboard");
                      });
                  });
                }}
                className="text-base font-semibold leading-7 text-black hover:text-gray-800"
              >
                View Demo <span aria-hidden="true">→</span>
              </button>
            </>
          )}
        </div>
        <div className="flex flex-row justify-end">
          <p className="text-lg sm:text-xl font-sans font-light absolute bottom-0 sm:bottom-4 pb-16 sm:pb-12">
            Backed by
            <span className="text-orange-600 py-0.5 px-1.5 rounded-sm font-bold">
              YCombinator
            </span>
          </p>
        </div>
        <div className="flex flex-row justify-center">
          <p className="text-lg sm:text-xl font-sans font-light absolute bottom-0 sm:bottom-1 pb-4">
            <ChevronDoubleDownIcon className="h-5 w-5 sm:h-6 sm:w-6 animate-bounce" />
          </p>
        </div>
      </div>
    </BasePage>
  );
};

export default HomePage;
