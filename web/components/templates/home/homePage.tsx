import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { Database } from "../../../supabase/database.types";
import BasePage from "../../shared/basePage";
import NavBar from "../../shared/navBar";

interface HomePageProps {}

const HomePage = (props: HomePageProps) => {
  const {} = props;
  const router = useRouter();
  const user = useUser();
  const supabaseClient = useSupabaseClient<Database>();

  return (
    <BasePage>
      <div className="h-4/5 justify-center align-middle items-left flex flex-col space-y-4">
        <p className="text-5xl sm:text-6xl font-sans">Valyr.ai</p>
        <p className="text-3xl sm:text-4xl font-sans font-light">
          Simplify GPT-3 observability with{" "}
          <span className="bg-sky-300 py-0.5 px-1.5 rounded-sm font-bold">
            one
          </span>{" "}
          line of code
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
                  in less than 3 minutes
                </span>
              </button>
              <button
                onClick={() => {
                  supabaseClient.auth.signOut().then(() => {
                    supabaseClient.auth
                      .signInWithPassword({
                        email: "valyrdemo@gmail.com",
                        password: "valyrdemo",
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
      </div>
    </BasePage>
  );
};

export default HomePage;
