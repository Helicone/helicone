import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { User } from "@supabase/supabase-js";
import { Dispatch, SetStateAction, useState } from "react";

import * as DashboardAnimation from "../../../public/lottie/DashboardAnimation.json";
import * as PartyParrot from "../../../public/lottie/PartyParrot.json";
import { Database } from "../../../supabase/database.types";
import { clsx } from "../../shared/clsx";
import AuthLayout from "../../shared/layout/authLayout";
import LoadingAnimation from "../../shared/loadingAnimation";
import * as loading from "../../../public/lottie/Loading.json";
import useNotification from "../../shared/notification/useNotification";

import ProgressBar from "../home/progressBar";
import KeyPage from "../keys/keyPage";
import Lottie from "react-lottie";
import { useQuery } from "@tanstack/react-query";
import { Result } from "../../../lib/result";
import { useRouter } from "next/router";

interface DashboardPageProps {
  user: User;
  keys: Database["public"]["Tables"]["user_api_keys"]["Row"][];
}

export type Loading<T> = T | "loading";

export const BaseUrlInstructions = () => {
  const { setNotification } = useNotification();
  const [lang, setLang] = useState<"python" | "curl" | "node">("node");

  const codeSnippet = () => {
    switch (lang) {
      case "python":
        return (
          <>
            <div className="flex flex-row gap-2">
              <p className="text-gray-300">
                # Change the default base API url to Helicone&apos;s
              </p>
            </div>
            <div className="flex flex-row gap-2">
              <p className="text-red-500">import </p>
              <p className="text-gray-300">openai </p>
            </div>
            <div className="flex flex-row gap-2 -ml-4 bg-green-900">
              <p className="text-green-700 pl-1 -mr-1 bg-green-900">+</p>
              <p className="text-gray-300">openai.api_base</p>
              <p className="text-blue-300">=</p>
              <p className="text-blue-400">
                &quot;https://oai.hconeai.com/v1&quot;
              </p>
            </div>
          </>
        );
      case "curl":
        return (
          <>
            <div className="flex flex-row gap-2">
              <p className="text-gray-300">Replace the OpenAI base url</p>
            </div>
            <div className="flex flex-row gap-2">
              <p className="text-purple-500">POST </p>
              <p className="text-red-500">https://api.openai.com/v1</p>
            </div>
            <div className="flex flex-row gap-2 mt-4">
              <p className="text-gray-300">with Helicone</p>
            </div>
            <div className="flex flex-row gap-2 -ml-4 bg-green-900">
              <p className="text-green-700 pl-1 -mr-1 bg-green-900">+</p>
              <p className="text-purple-500">POST </p>
              <p className="text-green-500">https://oai.hconeai.com/v1</p>
            </div>
          </>
        );
      case "node":
        return (
          <>
            <div className="flex flex-row gap-2">
              <p className="text-gray-300">
                {`//`} Add a basePath to the Configuration:
              </p>
            </div>
            <div className="flex flex-row xs:gap-0.5 gap-1">
              <p className="text-red-500">import</p>
              <p className="text-blue-300">{`{`}</p>
              <p className="text-gray-300">Configuration,OpenAIApi </p>
              <p className="text-blue-300">{`}`}</p>
              <p className="text-red-500">from</p>
              <p className="text-blue-300">{`"openai"`}</p>
            </div>
            <div className="flex flex-col">
              <div className="flex flex-row gap-2">
                <p className="text-red-500">const </p>
                <p className="text-blue-300">configuration </p>
                <p className="text-red-500">= new</p>
                <div className="flex flex-row">
                  <p className="text-purple-400">Configuration</p>
                  <p className="text-blue-300">{`(`} </p>
                  <p className="text-orange-500">{`{`}</p>
                </div>
              </div>
              <div className="flex flex-row gap-0 ml-4">
                <p className="text-gray-300">apiKey: process.env.</p>
                <div className="flex flex-row">
                  <p className="text-blue-300">OPENAI_API_KEY</p>
                  <p className="text-gray-300">,</p>
                </div>
              </div>
              <div className="flex flex-row gap-2 pl-4 bg-green-900">
                <div className="flex flex-row">
                  <p className="text-green-700 -ml-3 pr-1">+</p>
                  <p className="text-gray-300">basePath:</p>
                </div>

                <div className="flex flex-row">
                  <p className="text-blue-300">{`"https://oai.hconeai.com/v1"`}</p>
                  <p className="text-gray-300">,</p>
                </div>
              </div>
              <div className="flex flex-row">
                <p className="text-orange-500">{`}`}</p>
                <p className="text-blue-300">{`)`} </p>
                <p className="text-gray-300">;</p>
              </div>
            </div>
            <div className="flex flex-row gap-2">
              <p className="text-red-500">const </p>
              <p className="text-blue-300">openai </p>
              <p className="text-red-500">= new</p>
              <div className="flex flex-row">
                <p className="text-purple-400">OpenAIApi</p>
                <p className="text-blue-300">{`(configuration)`} </p>
                <p className="text-gray-300">;</p>
              </div>
            </div>
          </>
        );
      default:
        return <div></div>;
    }
  };

  const copyLineHandler = () => {
    switch (lang) {
      case "node":
        navigator.clipboard.writeText(
          `basePath: "https://oai.hconeai.com/v1" `
        );
        setNotification("Copied Node code to clipboard", "success");
        break;
      case "python":
        navigator.clipboard.writeText(
          `openai.api_base="https://oai.hconeai.com/v1"`
        );
        setNotification("Copied Python code to clipboard", "success");
        break;
      case "curl":
        navigator.clipboard.writeText(`https://oai.hconeai.com/v1`);
        setNotification("Copied cURL code to clipboard", "success");
        break;
      default:
        navigator.clipboard.writeText("hello");
    }
  };

  return (
    <div className="space-y-4">
      <span className="isolate inline-flex rounded-md shadow-sm w-full">
        <button
          onClick={() => setLang("node")}
          type="button"
          className={clsx(
            lang === "node" ? "bg-gray-200" : "",
            "w-full text-center justify-center relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          )}
        >
          Node.js
        </button>
        <button
          onClick={() => setLang("python")}
          type="button"
          className={clsx(
            lang === "python" ? "bg-gray-200" : "",
            "w-full text-center justify-center relative -ml-px inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          )}
        >
          Python
        </button>
        <button
          onClick={() => setLang("curl")}
          type="button"
          className={clsx(
            lang === "curl" ? "bg-gray-200" : "",
            "w-full text-center justify-center relative -ml-px inline-flex items-center rounded-r-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          )}
        >
          Curl
        </button>
      </span>
      <div className="overflow-hidden rounded-md bg-gray-900 ring-1 ring-white/10">
        <div className="px-6 pt-6 pb-8 min-h-[20em] flex flex-col gap-4 font-mono text-[10px] sm:text-sm">
          {codeSnippet()}
        </div>
      </div>
      <button
        onClick={copyLineHandler}
        className="flex flex-row w-full justify-center items-center rounded-md bg-gray-200 text-black px-3.5 py-1.5 text-base font-semibold leading-7 shadow-sm hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <ClipboardDocumentListIcon className="w-5 h-5 mr-2" />
        Copy
      </button>
    </div>
  );
};

const RenderStepActions = ({
  currentStep,
  setCurrentStep,
  totalSteps,
}: {
  currentStep: number;
  setCurrentStep: Dispatch<SetStateAction<Steps>>;
  totalSteps: number;
}) => {
  if (currentStep === totalSteps) {
    return (
      <div className="bottom-0 relative flex flex-row justify-start flex-1 pt-8">
        <button
          onClick={() => setCurrentStep((currentStep - 1) as Steps)}
          className="rounded-md bg-gray-200 text-black px-3.5 py-1.5 text-base font-semibold leading-7 shadow-sm hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Back
        </button>
      </div>
    );
  } else if (currentStep === 1) {
    return (
      <div className="bottom-0 relative flex flex-row justify-end flex-1 pt-8">
        <button
          onClick={() => setCurrentStep((currentStep + 1) as Steps)}
          className="rounded-md bg-black px-3.5 py-1.5 text-base font-semibold leading-7 text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Next
        </button>
      </div>
    );
  } else {
    return (
      <div className="bottom-0 relative flex flex-row justify-between flex-1 pt-8">
        <button
          onClick={() => setCurrentStep((currentStep - 1) as Steps)}
          className="rounded-md bg-gray-200 text-black px-3.5 py-1.5 text-base font-semibold leading-7 shadow-sm hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Back
        </button>
        <button
          onClick={() => setCurrentStep((currentStep + 1) as Steps)}
          className="rounded-md bg-black px-3.5 py-1.5 text-base font-semibold leading-7 text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Next
        </button>
      </div>
    );
  }
};

const Step1 = () => {
  return (
    <div className="flex flex-col gap-4">
      {" "}
      <p className="text-gray-500">
        Within your codebase, replace your OpenAI call with the following code
        snippet.
      </p>
      <BaseUrlInstructions />
    </div>
  );
};

const Step2 = () => {
  return (
    <div>
      {" "}
      <p className="text-gray-500"></p>
      <KeyPage hideTabs={true} />
    </div>
  );
};

const Step3 = () => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const router = useRouter();

  const { data } = useQuery({
    queryKey: ["requestsCount"],
    queryFn: async () => {
      if (data?.data === 0 || (data?.data ?? null) == null) {
        setTimeElapsed((prev) => prev + 3);
        return await fetch("/api/request/count", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filter: "all",
          }),
        }).then((res) => res.json() as Promise<Result<number, string>>);
      }
    },
    refetchOnWindowFocus: false,
    refetchInterval: 3000,
  });

  if (data?.data === 0 || (data?.data ?? null) === null) {
    return (
      <div>
        <div className="flex flex-col gap-2 items-center">
          <div className="text-2xl text-gray-600">Listening for events</div>
          <Lottie
            options={{
              loop: true,
              autoplay: true,
              animationData: loading,
              rendererSettings: {
                preserveAspectRatio: "xMidYMid slice",
              },
            }}
            height={100}
            width={100}
            isStopped={false}
            isPaused={false}
            style={{
              pointerEvents: "none",
              background: "transparent",
            }}
          />
          <div>
            Once we receive your first event you can visit your dashboard
          </div>
          {timeElapsed > 30 && (
            <div className="text-sm mt-10">
              Note: This should be instant, but if you{"'"}re still waiting
              after 30 seconds, please join our discord and we{"'"}ll help you
              out. Or you can email us at help@helicone.ai.
            </div>
          )}
        </div>
      </div>
    );
  } else {
    return (
      <div>
        <div className="flex flex-col gap-2 items-center">
          <Lottie
            options={{
              loop: true,
              autoplay: true,
              animationData: PartyParrot,
              rendererSettings: {
                preserveAspectRatio: "xMidYMid slice",
              },
            }}
            height={100}
            width={100}
            isStopped={false}
            isPaused={false}
            style={{
              pointerEvents: "none",
              background: "transparent",
            }}
          />
          <div>We received an event! You are all set 🚀</div>
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-md bg-black px-3.5 py-1.5 text-base font-semibold leading-7 text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Dashboard
          </button>
        </div>
      </div>
    );
  }
};

type Steps = 1 | 2 | 3;

const stepComponents: {
  [key in Steps]: () => JSX.Element;
} = {
  1: Step1,
  2: Step2,
  3: Step3,
};
const StepComponent = ({ step }: { step: Steps }) => {
  const Step = stepComponents[step];
  return <Step />;
};

const WelcomePage = (props: DashboardPageProps) => {
  const { user, keys } = props;
  const [step, setStep] = useState<Steps>(1);
  const totalSteps = Object.keys(stepComponents).length;
  const stepMessage: {
    [key in Steps]: string;
  } = {
    1: "Replace you OpenAI base url",
    2: "Add your OpenAI API Key to Helicone",
    3: "Wait for your first event",
  };

  return (
    <AuthLayout user={user} hideSidebar={true}>
      <div className="flex flex-col flex-1 gap-5 w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div
          className="
        sm:max-w-2xl flex flex-col space-y-2 w-full min-w-[300px] sm:min-w-[450px]"
        >
          <h1 className="text-3xl font-bold text-gray-900 w-full text-center mb-10">
            Welcome to Helicone 🚀
          </h1>
          <div className="w-full border-b border-gray-300 pb-4 justify-between flex flex-col items-center text-center space-y-4">
            <p className="text-lg font-medium w-full">{`Step ${step}: ${stepMessage[step]}`}</p>
            <div className="w-full justify-center items-center mx-auto flex">
              <ProgressBar currentStep={step} totalSteps={totalSteps} />
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <div className="h-full flex flex-col w-full pt-2">
              <div className="pt-2 w-full flex-auto">
                <StepComponent step={step} />
              </div>
            </div>
            <RenderStepActions
              currentStep={step}
              setCurrentStep={setStep}
              totalSteps={totalSteps}
            />
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default WelcomePage;
