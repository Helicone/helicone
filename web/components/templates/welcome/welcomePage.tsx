import {
  ChevronRightIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { User } from "@supabase/supabase-js";
import { useState } from "react";
import { Database } from "../../../supabase/database.types";
import { clsx } from "../../shared/clsx";
import useNotification from "../../shared/notification/useNotification";
import React from "react";
import { DiffHighlight } from "./diffHighlight";
import WelcomeSteps from "./welcomeSteps";
import ListeningForEvent from "./listeningForEvent";
import GenerateApiKey from "./generateAPIKey";

interface DashboardPageProps {
  user: User;
  keys: Database["public"]["Tables"]["user_api_keys"]["Row"][];
}

export type Loading<T> = T | "loading";

interface BaseUrlInstructionsProps {
  apiKey: string;
  nextStep?: () => void;
}

const CODE_CONVERTS = {
  curl: (key: string) => `
  curl --request POST \\
  --url https://oai.hconeai.com/v1/chat/completions \\
  --header 'Authorization: Bearer OPENAI_API_KEY' \\
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
    <>
      <div className="space-y-4 text-sm">
        <span className="isolate flex flex-col sm:flex-row rounded-md shadow-sm w-full">
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
          code={CODE_CONVERTS[lang](props.apiKey || "<YOUR_API_KEY>")}
          language="bash"
          newLines={DIFF_LINES[lang]}
          oldLines={[]}
        />
        <button
          onClick={() => {
            navigator.clipboard.writeText(CODE_CONVERTS[lang](props.apiKey));
            setNotification("Copied to clipboard", "success");
          }}
          className="flex flex-row w-full justify-center items-center rounded-md bg-sky-500 text-white px-3.5 py-1.5 text-base font-semibold leading-7 shadow-sm hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <ClipboardDocumentListIcon className="w-5 h-5 mr-2" />
          Copy
        </button>
      </div>
      {props.nextStep && (
        <div className="flex flex-row justify-end items-center">
          <button
            onClick={props.nextStep}
            className="items-center flex flex-row rounded-md bg-black px-4 py-2 text-base font-semibold leading-7 text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Code change completed
            <ChevronRightIcon className="h-4 w-4 inline" />
          </button>
        </div>
      )}
    </>
  );
};

const WelcomePage = (props: DashboardPageProps) => {
  const { user, keys } = props;
  const [step, setStep] = useState(1);
  const [apiKey, setApiKey] = useState("");
  const steps = [
    {
      id: 1,
      label: "Step 1",
      name: "Generate API Key",
      status: step >= 1,
    },
    {
      id: 2,
      label: "Step 2",
      name: "Code Change",
      status: step >= 2,
    },
    { id: 3, label: "Step 3", name: "Listen for events", status: step >= 3 },
  ];

  const stepMap = [
    <GenerateApiKey
      key={1}
      apiKey={apiKey}
      setApiKey={setApiKey}
      nextStep={() => setStep((prev) => prev + 1)}
    />,
    <BaseUrlInstructions
      apiKey={apiKey}
      key={2}
      nextStep={() => setStep((prev) => prev + 1)}
    />,
    <ListeningForEvent key={3} />,
  ];

  return (
    <div className="flex flex-col py-24 w-full max-w-2xl mx-auto min-h-max px-4 mx-auto">
      <h1 className="text-3xl font-semibold text-gray-900 w-full text-center mb-10">
        Get Started with Helicone
      </h1>
      <div className="flex flex-col h-full min-h-[30rem] space-y-8">
        <WelcomeSteps setStep={setStep} steps={steps} />
        {stepMap[step - 1]}
      </div>
    </div>
  );
};

export default WelcomePage;
