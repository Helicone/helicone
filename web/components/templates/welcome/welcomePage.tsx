import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { SupabaseClient, User } from "@supabase/supabase-js";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

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

import React from "react";
import { DiffHighlight } from "./diffHighlight";
import generateApiKey from "generate-api-key";
import { hashAuth } from "../../../lib/hashClient";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";

interface DashboardPageProps {
  user: User;
  keys: Database["public"]["Tables"]["user_api_keys"]["Row"][];
}

export type Loading<T> = T | "loading";

interface BaseUrlInstructionsProps {
  apiKey: string;
}

const CODE_CONVERTS = {
  curl: (key: string) => `
  curl --request POST \\
  --url https://oai.hconeai.com/v1/chat/completions \\
  --header 'Authorization: Bearer <OPEN_AI_API_KEY>' \\
  --header 'Helicone-Auth: Bearer ${key}' \\
  --header 'Content-Type: application/json' \\
  --data '{
	"model": "gpt-3.5-turbo",
	"messages": [
		{
			"role": "system",
			"content": "Say Hello!"
		}
	],
	"temperature": 1,
	"max_tokens": 10
}'
`,
  typescript: (key: string) => `
import {Configuration, OpenAIApi} from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
  // Add a basePath to the Configuartion
  basePath: "https://oai.hconeai.com/v1",
  {
    headers: {
      // Add your Helicone API Key
      "Helicone-Auth": "Bearer ${key}",
    },
  }
});

const openai = new OpenAIApi(configuration);`,

  python: (key: string) => `
openai.api_base = "https://oai.hconeai.com/v1"

openai.Completion.create(
    # ...other parameters
    headers={
      "Helicone-Auth": "Bearer ${key}",
    }
)
`,

  langchain_python: (key: string) => `
openai.api_base = "https://oai.hconeai.com/v1"

llm = OpenAI(
  temperature=0.9,
  headers={
    "Helicone-Auth": "Bearer ${key}"
  }
)
`,
  langchain_typescript: (key: string) => `
const model = new OpenAI(
  {},
  {
    basePath: "https://oai.hconeai.com/v1",
    baseOptions: {
      headers: {
        "Helicone-Auth": "Bearer ${key}"
      },
    },
  }
);
`,
};

type SupportedLanguages = keyof typeof CODE_CONVERTS;

const DIFF_LINES: {
  [key in SupportedLanguages]: number[];
} = {
  typescript: [5, 9],
  python: [0, 5],
  curl: [],
  langchain_python: [0, 5],
  langchain_typescript: [3, 6],
};

const NAMES: {
  [key in SupportedLanguages]: string;
} = {
  curl: "cURL",
  typescript: "Node.js",
  python: "Python",
  langchain_python: "LangChain",
  langchain_typescript: "LangChainJS",
};

export const BaseUrlInstructions = (props: BaseUrlInstructionsProps) => {
  const { setNotification } = useNotification();
  const [lang, setLang] = useState<SupportedLanguages>("typescript");

  return (
    <div className="space-y-4">
      <span className="isolate inline-flex rounded-md shadow-sm w-full">
        {Object.entries(NAMES).map(([key, name], i) => (
          <button
            onClick={() => setLang(key as SupportedLanguages)}
            type="button"
            className={clsx(
              lang === key ? "bg-gray-200" : "",
              "w-full text-center justify-center relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500",
              i === 0 ? "rounded-l-md" : "",
              i === Object.entries(NAMES).length - 1 ? "rounded-r-md" : ""
            )}
            key={key}
          >
            {name}
          </button>
        ))}
      </span>
      <DiffHighlight
        code={CODE_CONVERTS[lang](props.apiKey)}
        language="bash"
        newLines={DIFF_LINES[lang]}
        oldLines={[]}
      />
      <button
        onClick={() => {
          navigator.clipboard.writeText(CODE_CONVERTS[lang](props.apiKey));
          setNotification("Copied to clipboard", "success");
        }}
        className="flex flex-row w-full justify-center items-center rounded-md bg-gray-200 text-black px-3.5 py-1.5 text-base font-semibold leading-7 shadow-sm hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <ClipboardDocumentListIcon className="w-5 h-5 mr-2" />
        Copy
      </button>
    </div>
  );
};

async function generateAPIKey() {
  const apiKey = `sk-${generateApiKey({
    method: "base32",
    dashes: true,
  }).toString()}`.toLowerCase();
  return await hashAuth(apiKey);
}
async function generateAndEnsureOnlyOneApiKey(
  supabaseClient: SupabaseClient<Database>,
  user: User,
  hashedKey: string
): Promise<void> {
  await supabaseClient
    .from("helicone_api_keys")
    .delete()
    .eq("user_id", user.id);

  await supabaseClient.from("helicone_api_keys").insert({
    api_key_hash: hashedKey,
    user_id: user.id,
    api_key_name: "first api key",
  });
}

const KeySetup = () => {
  const { setNotification } = useNotification();
  const [apiKey, setApiKey] = useState<string>("<API_KEY>");
  const supabase = useSupabaseClient();
  const user = useUser();

  useEffect(() => {
    if (user == null) {
      return;
    }
    generateAPIKey().then(async (key) => {
      setApiKey(key);
      await generateAndEnsureOnlyOneApiKey(supabase, user, key);
    });
  }, [supabase, user]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold leading-6 text-gray-900 mb-3">
        Change your endpoint to point to Helicone
      </h1>
      <div className="flex flex-col gap-4 space-y-2 w-full max-w-6xl">
        <h3 className="text-lg font-medium leading-6 text-gray-700 ">
          <div className="flex flex-col gap-3">
            <div className="flex flex-row items-center gap-3">
              <input
                className="border border-gray-300 rounded-md p-2 w-full"
                value={apiKey}
                disabled={true}
                onClick={() => {
                  navigator.clipboard.writeText(apiKey);
                  setNotification("Copied to clipboard!", "success");
                }}
              />
              <button
                className="bg-green-500 h-10 w-10 items-center flex flex-col justify-center rounded-md"
                onClick={() => {
                  navigator.clipboard.writeText(apiKey);
                  setNotification("Copied to clipboard!", "success");
                }}
              >
                <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            <i className="font-light">
              note: This will be the only time you will see this key, if you
              refresh the page or lose this key you will need to generate a new
              one.
            </i>
          </div>
        </h3>
      </div>
      <div>
        Don{"'"}t see your language? We probably support it, check out our{" "}
        <a href="https://docs.helicone.ai" className="font-bold">
          docs
        </a>{" "}
        or reach on discord and we can work with you to support whatever
        language you are using
      </div>
      <BaseUrlInstructions apiKey={apiKey} />
    </div>
  );
};

const WaitingForFirstEvent = () => {
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
          {timeElapsed > 60 && (
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

const WelcomePage = (props: DashboardPageProps) => {
  const { user, keys } = props;

  return (
    <AuthLayout user={user} hideSidebar={true}>
      <div className="flex flex-col flex-1 gap-5 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <h1 className="text-3xl font-bold text-gray-900 w-full text-center mb-10">
          Welcome to Helicone 🚀
        </h1>

        <div className="flex flex-col space-y-2 gap-5">
          <KeySetup />
          <WaitingForFirstEvent />
        </div>
      </div>
    </AuthLayout>
  );
};

export default WelcomePage;
