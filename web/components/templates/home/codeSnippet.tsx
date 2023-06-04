import { useState } from "react";
import { Tab } from "@headlessui/react";
import { clsx } from "../../shared/clsx";
import { DiffHighlight } from "../welcome/diffHighlight";

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
  import { Configuration, OpenAIApi } from "openai";
  
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
    // Add a basePath to the Configuration
    basePath: "https://oai.hconeai.com/v1",
    baseOptions: {
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

export default function CodeSnippet() {
  const [lang, setLang] = useState<SupportedLanguages>("typescript");

  return (
    <div className="w-full py-16">
      <Tab.Group defaultIndex={1}>
        <Tab.List className="flex space-x-1 rounded-xl bg-sky-900 p-1">
          {Object.entries(NAMES).map(([key, name]) => (
            <Tab
              key={key}
              className={({ selected }) =>
                clsx(
                  "w-full rounded-lg py-2.5 text-sm font-medium leading-5",
                  "ring-white ring-opacity-60 ring-offset-2 ring-offset-sky-300 focus:outline-none focus:ring-2",
                  selected
                    ? "bg-sky-500 shadow text-white"
                    : "text-sky-100 hover:bg-sky-700 hover:text-white"
                )
              }
              onClick={() => setLang(key as SupportedLanguages)}
            >
              {name}
            </Tab>
          ))}
        </Tab.List>
        <DiffHighlight
          code={CODE_CONVERTS[lang]("<YOUR_API_KEY>")}
          language="bash"
          newLines={DIFF_LINES[lang]}
          oldLines={[]}
          mode="themed"
        />
      </Tab.Group>
    </div>
  );
}
