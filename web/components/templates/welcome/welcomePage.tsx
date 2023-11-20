import { ArrowLeftIcon, ChevronLeftIcon } from "@heroicons/react/20/solid";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { User, useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { getOrCreateUserSettings } from "../../../pages/api/user_settings";
import { clsx } from "../../shared/clsx";
import CodeIntegration from "./steps/codeIntegration";
import EventListen from "./steps/eventListen";
import Features from "./steps/features";
import GenerateAPIKey from "./steps/generateAPIKey";
import GetStarted from "./steps/getStarted";
import MethodFork, { IntegrationMethods, Providers } from "./steps/methodFork";
import MfsCoupon from "./steps/mfsCoupon";

interface WelcomePageProps {}

export type HeliconeMethod = "proxy" | "async";

export type UnionProviderMethods = `${keyof Providers &
  string}-${keyof IntegrationMethods & string}`;

const WelcomePage = (props: WelcomePageProps) => {
  const user = useUser();

  const router = useRouter();
  const supabaseClient = useSupabaseClient();

  const [step, setStep] = useState<number>(0);
  const [apiKey, setApiKey] = useState<string>("");
  const [providerMethod, setProviderMethod] = useState<UnionProviderMethods>();

  const nextStep = () => {
    setStep(step + 1);
  };

  // check for the localStorage mfs item
  let isMfs = false;

  if (typeof window !== "undefined") {
    const mfsEmail = window.localStorage.getItem("mfs-email");
    isMfs = mfsEmail !== null;
  }

  const stepArray = [
    <GetStarted key={0} nextStep={nextStep} />,
    <GenerateAPIKey
      key={2}
      nextStep={nextStep}
      apiKey={apiKey}
      setApiKey={setApiKey}
    />,
    <MethodFork
      key={3}
      nextStep={(provider, integration) => {
        setProviderMethod(`${provider}-${integration}`);
        nextStep();
      }}
      currentIntegration={
        providerMethod?.split("-")[1] as keyof IntegrationMethods | undefined
      }
      currentProvider={
        providerMethod?.split("-")[0] as keyof Providers | undefined
      }
    />,
    <CodeIntegration
      key={4}
      nextStep={nextStep}
      apiKey={apiKey}
      providerMethod={providerMethod}
    />,
    <EventListen
      key={5}
      nextStep={async () => {
        router.push("/dashboard");
      }}
    />,
  ];

  // if the user is from mfs, insert the mfsCoupon component into the second to last spot in the array
  if (isMfs) {
    stepArray.splice(
      stepArray.length - 1,
      0,
      <MfsCoupon key={6} nextStep={nextStep} />
    );
  }

  return (
    <div className="bg-gray-200 h-screen w-screen overflow-hidden items-center justify-center align-middle flex flex-col text-gray-900 relative">
      <div className="flex flex-row justify-between items-center w-full top-0 absolute">
        <button
          onClick={() => {
            supabaseClient.auth.signOut().then(() => {
              router.push("/");
            });
          }}
          className="p-8 flex flex-row gap-1 text-xs items-center underline underline-offset-2 font-semibold text-gray-900"
        >
          <ArrowLeftIcon className="h-3 w-3 inline" />
          Sign Out
        </button>
        <button
          onClick={async () => {
            const { data: userSettings, error: userSettingsError } =
              await supabaseClient
                .from("user_settings")
                .select("*")
                .eq("user", user?.id)
                .single();

            if (userSettings === null) {
              // add the user into the userSettings page
              const { data: newUserSettings, error: newUserSettingsError } =
                await supabaseClient
                  .from("user_settings")
                  .insert({
                    user: user?.id,
                    tier: "free",
                    request_limit: 100_000,
                  })
                  .select("*")
                  .single();
            }

            router.push("/dashboard");
          }}
          className="p-8 flex flex-row gap-1 text-xs items-center underline underline-offset-2 font-semibold text-gray-900"
        >
          Skip Onboarding
          <ArrowRightIcon className="h-3 w-3 inline" />
        </button>
      </div>

      {stepArray[step]}
      <div className="h-4 w-full mx-auto bottom-0 mb-8 absolute flex">
        <ul className="flex flex-row gap-6 items-center w-full mx-auto justify-center">
          {Array.from({ length: stepArray.length }).map((_, i) => (
            <li
              key={i}
              onClick={() => setStep(i)}
              className={clsx(
                step >= i ? "bg-gray-700" : "bg-gray-300",
                "h-2.5 w-2.5 rounded-full hover:cursor-pointer"
              )}
            />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default WelcomePage;
