import { useState } from "react";
import { Tab } from "@headlessui/react";
import { clsx } from "../../shared/clsx";
import { DiffHighlight } from "../welcome/diffHighlight";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

const CODE_CONVERTS = {
  curl: (key: string) => `
    curl --request POST \\
    --url ${BASE_PATH}/chat/completions \\
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
  import OpenAI from "openai";
  const openai = new OpenAI({
    baseURL: 'https://oai.hconeai.com/v1',
    defaultHeaders: {
      'Helicone-Auth': 'Bearer ' + process.env.HELICONE_API_KEY,
    });
    `,

  python: (key: string) => `
  openai.api_base = "${BASE_PATH}"
  
  openai.Completion.create(
      # ...other parameters
      headers={
        "Helicone-Auth": "Bearer ${key}",
      }
  )
  `,

  langchain_python: (key: string) => `
  openai.api_base = "${BASE_PATH}"
  
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
      basePath: "${BASE_PATH}",
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
  curl: [1, 3],
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

interface CodeSnippetProps {
  variant: "themed" | "simple";
  apiKey?: string;
}

export default function CodeSnippet(props: CodeSnippetProps) {
  const { variant, apiKey = "<YOUR_API_KEY>" } = props;
  const [lang, setLang] = useState<SupportedLanguages>("typescript");

  return (
    <div className="w-full flex flex-col">
      <Tab.Group defaultIndex={1}>
        <Tab.List
          className={clsx(
            variant === "themed" ? "bg-sky-900" : "bg-gray-500",
            "flex space-x-1 rounded-xl p-1"
          )}
        >
          {Object.entries(NAMES).map(([key, name]) => (
            <Tab
              key={key}
              className={({ selected }) =>
                clsx(
                  "w-full rounded-lg py-2.5 text-sm font-medium leading-5",
                  "ring-white ring-opacity-60 ring-offset-2 focus:outline-none focus:ring-2",
                  variant === "themed"
                    ? "ring-offset-sky-300"
                    : "ring-offset-gray-700",
                  selected
                    ? variant === "themed"
                      ? "bg-sky-500 shadow text-white"
                      : "bg-gray-900 text-white"
                    : variant === "themed"
                    ? "text-sky-100 hover:bg-sky-700 hover:text-white"
                    : "text-gray-100 hover:bg-gray-700 hover:text-white"
                )
              }
              onClick={() => setLang(key as SupportedLanguages)}
            >
              {name}
            </Tab>
          ))}
        </Tab.List>
        <DiffHighlight
          code={CODE_CONVERTS[lang](apiKey)}
          language="bash"
          newLines={DIFF_LINES[lang]}
          oldLines={[]}
        />
      </Tab.Group>
    </div>
  );
}
