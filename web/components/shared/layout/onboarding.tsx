import {
  ArrowPathIcon,
  CheckIcon,
  ClipboardDocumentListIcon,
  EnvelopeIcon,
  InboxArrowDownIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useState } from "react";
import { clsx } from "../clsx";
import ProgressBar from "../../templates/home/progressBar";
import useNotification from "../notification/useNotification";

interface OnboardingProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

const Onboarding = (props: OnboardingProps) => {
  const { currentStep, setCurrentStep } = props;
  const [lang, setLang] = useState<"python" | "curl" | "node">("node");
  const [authError, setAuthError] = useState<string>();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const supabaseClient = useSupabaseClient();
  const { setNotification } = useNotification();

  const setLangHandler = (lang: "python" | "curl" | "node") => {
    setLang(lang);
  };

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

  const renderStepMessage = () => {
    switch (currentStep) {
      case 1:
        return "Change your base path";
      case 2:
        return "Create an account";
      case 3:
        return "Confirm your email";
      default:
        return "Change your base path";
    }
  };

  const signUpHandler = async (email: string, password: string) => {
    if (email === "") {
      setAuthError("Email is required");
      return;
    }
    if (password === "") {
      setAuthError("Password is required");
      return;
    }

    setLoading(true);
    const { data: user, error: authError } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `https://${origin}/keys`,
      },
    });

    if (authError) {
      setAuthError(authError.message);
      setLoading(false);
      return;
    }

    setLoading(false);

    setCurrentStep(currentStep + 1);
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

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <span className="isolate inline-flex rounded-md shadow-sm w-full">
              <button
                onClick={() => setLangHandler("node")}
                type="button"
                className={clsx(
                  lang === "node" ? "bg-gray-200" : "",
                  "w-full text-center justify-center relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                )}
              >
                Node.js
              </button>
              <button
                onClick={() => setLangHandler("python")}
                type="button"
                className={clsx(
                  lang === "python" ? "bg-gray-200" : "",
                  "w-full text-center justify-center relative -ml-px inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                )}
              >
                Python
              </button>
              <button
                onClick={() => setLangHandler("curl")}
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
      case 2:
        return (
          <div className="flex min-h-full items-center justify-center">
            <div className="w-full max-w-md space-y-8">
              <div className="space-y-4">
                <input type="hidden" name="remember" defaultValue="true" />
                <div className="-space-y-px rounded-md shadow-sm">
                  <div>
                    <label htmlFor="email-address" className="sr-only">
                      Email address
                    </label>
                    <input
                      id="email-address"
                      name="email"
                      type="email"
                      autoComplete="email"
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 text-md sm:text-lg p-2 sm:p-4 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                      placeholder="Email address"
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="sr-only">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 text-md sm:text-lg p-2 sm:p-4 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                      placeholder="Password"
                    />
                  </div>
                </div>
                {authError && (
                  <div className="mt-4 text-sm text-red-600 w-full">
                    <p>{authError}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col border border-black rounded-lg p-8 items-center text-center justify-center text-black text-lg sm:text-lg bg-gray-200 max-w-[450px]">
            <InboxArrowDownIcon className="w-12 h-12 mb-4 animate-bounce" />
            <p>
              Check your email ({email}) for a confirmation link. If you
              don&apos;t see it, check your spam folder.
            </p>{" "}
          </div>
        );
      default:
        return <div>hello</div>;
    }
  };

  const renderStepActions = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="bottom-0 relative flex flex-row justify-end flex-1 pt-8">
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="rounded-md bg-black px-3.5 py-1.5 text-base font-semibold leading-7 text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Next
            </button>
          </div>
        );
      case 2:
        return (
          <div className="bottom-0 relative flex flex-row justify-between flex-1 pt-8">
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="rounded-md bg-gray-200 text-black px-3.5 py-1.5 text-base font-semibold leading-7 shadow-sm hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Back
            </button>
            <button
              onClick={() => signUpHandler(email, password)}
              className="rounded-md bg-black px-3.5 py-1.5 text-base font-semibold leading-7 text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {loading ? (
                <div className="flex flex-row items-center">
                  <ArrowPathIcon className="w-4 h-4 mr-1.5 animate-spin" />
                  Creating...
                </div>
              ) : (
                <div className="flex flex-row items-center">Create</div>
              )}
            </button>
          </div>
        );
      case 3:
        return (
          <div className="bottom-0 relative flex flex-row justify-start flex-1 pt-8">
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="rounded-md bg-gray-200 text-black px-3.5 py-1.5 text-base font-semibold leading-7 shadow-sm hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Back
            </button>
          </div>
        );
    }
  };

  return (
    <div className="sm:max-w-2xl flex flex-col space-y-2 w-full min-w-[300px] sm:min-w-[450px]">
      <div className="w-full border-b border-gray-300 pb-4 justify-between flex flex-col items-center text-center space-y-4">
        <p className="text-lg font-medium w-full">{`Step ${currentStep}: ${renderStepMessage()}`}</p>
        <div className="w-full justify-center items-center mx-auto flex">
          <ProgressBar currentStep={currentStep} />
        </div>
      </div>
      <div className="flex flex-col space-y-2">
        <div className="h-full flex flex-col w-full pt-2">
          <div className="pt-2 w-full flex-auto">{renderStep()}</div>
        </div>
        {renderStepActions()}
      </div>
    </div>
  );
};

export default Onboarding;
