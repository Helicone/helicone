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
import CreateOrg from "./steps/createOrg";
import { useOrg } from "../../shared/layout/organizationContext";

interface WelcomePageProps {}

export type HeliconeMethod = "proxy" | "async";

export type UnionProviderMethods = `${keyof Providers &
  string}-${keyof IntegrationMethods & string}`;

export type OrgProps = {
  id: string;
  name: string;
  size: string;
  referral: string;
};

const WelcomePage = (props: WelcomePageProps) => {
  const user = useUser();

  const router = useRouter();
  const supabaseClient = useSupabaseClient();

  const [step, setStep] = useState<number>(0);
  const [apiKey, setApiKey] = useState<string>("");
  const [org, setOrg] = useState<OrgProps>();

  const orgContext = useOrg();

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
    <CreateOrg key={1} nextStep={nextStep} />,
    <GenerateAPIKey
      key={2}
      nextStep={nextStep}
      apiKey={apiKey}
      setApiKey={setApiKey}
    />,

    <CodeIntegration key={4} nextStep={nextStep} apiKey={apiKey} />,
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
    <div className="bg-white h-screen w-screen overflow-hidden items-center justify-center align-middle flex flex-col text-gray-900 relative isolate">
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
        {user?.email && (
          <div className="flex flex-col gap-1 text-start p-8">
            <p className="text-xs text-gray-500">Logged in as:</p>
            <p className="text-sm text-gray-900">{user?.email}</p>
          </div>
        )}
      </div>
      <svg
        className="absolute inset-0 -z-10 h-full w-full stroke-gray-200 [mask-image:radial-gradient(100%_60%_at_top_center,white,transparent)]"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="abc"
            width={25}
            height={25}
            x="50%"
            y={-1}
            patternUnits="userSpaceOnUse"
          >
            <path d="M25 200V.5M.5 .5H200" fill="none" />
          </pattern>
          <defs>
            <pattern
              id="123"
              width="12.5"
              height="12.5"
              patternUnits="userSpaceOnUse"
            >
              <path d="M12.5 0V12.5M0 12.5H12.5" fill="none" />
            </pattern>
          </defs>
        </defs>
        <rect width="100%" height="100%" strokeWidth={0} fill="url(#abc)" />
      </svg>

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
