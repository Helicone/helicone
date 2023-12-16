import { Tab } from "@headlessui/react";
import { useState } from "react";
import { clsx } from "../../../../shared/clsx";
import { DiffHighlight } from "../../diffHighlight";

interface AnthropicProxyProps {
  apiKey: string;
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

const CODE_CONVERTS = {
  curl: (key: string) => `
curl --request POST \\
    --url https://api.anthropic.com/v1/complete \\
    --header 'Content-Type: application/json' \\
    --header 'Helicone-Auth: Bearer ${key} \\
    --header 'x-api-key: <<ANTHROPIC_API_KEY>> \\
    --data '{
	    "prompt": "Human: Tell me a haiku about trees Assistant:",
	    "model": "claude-v1-100k",
	    "max_tokens_to_sample": 300,
	    "stop_sequences": [
	    	"Human:"
	    ]
    }'
  `,

  python: (key: string) => `
import anthropic
client = anthropic.Client(
    api_key="<Anthropic API Key>",
    api_url="https://anthropic.hconeai.com/v1"
)
res = client._request_as_json(
    "post",
    "v1/complete",
    params={
        "prompt": f"{anthropic.HUMAN_PROMPT} How many toes do dogs have?{anthropic.AI_PROMPT}",
        "stop_sequences": [anthropic.HUMAN_PROMPT],
        "model": "claude-v1",
        "max_tokens_to_sample": 300,
    },
    headers={
        "Helicone-Auth": "Bearer ${key}"
    }
)
  `,
};

const DIFF_LINES: {
  [key in SupportedLanguages]: number[];
} = {
  python: [3, 15],
  curl: [1, 3],
};

const NAMES: {
  [key in SupportedLanguages]: string;
} = {
  curl: "cURL",

  python: "Python",
};

type SupportedLanguages = keyof typeof CODE_CONVERTS;

const AnthropicProxy = (props: AnthropicProxyProps) => {
  const { apiKey } = props;

  const [lang, setLang] = useState<SupportedLanguages>("python");

  return (
    <div className="w-full flex flex-col">
      <Tab.Group defaultIndex={1}>
        <Tab.List
          className={clsx("bg-gray-500", "flex space-x-1 rounded-xl p-1")}
        >
          {Object.entries(NAMES).map(([key, name]) => (
            <Tab
              key={key}
              className={({ selected }) =>
                clsx(
                  "w-full rounded-lg py-2.5 text-sm font-medium leading-5",
                  "ring-white ring-opacity-60 ring-offset-2 focus:outline-none focus:ring-2",
                  "ring-offset-gray-700",
                  selected
                    ? "bg-gray-900 text-white"
                    : "text-gray-100 hover:bg-gray-700 hover:text-white"
                )
              }
              onClick={() => setLang(key as keyof typeof NAMES)}
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
        {/* {lang === "curl" && (
          <div className="flex flex-col space-y-8 py-8">
            <div className="flex flex-col">
              <p className="text-md text-gray-700 font-light">
                Step 1: Install the Helicone package
              </p>
              <DiffHighlight
                code={`npm install helicone`}
                language="bash"
                newLines={[]}
                oldLines={[]}
                minHeight={false}
              />
            </div>
            <div className="flex flex-col">
              <p className="text-md text-gray-700 font-light">
                Step 2: Add HELICONE_API_KEY to your environment variables.
              </p>
              <DiffHighlight
                code={`export HELICONE_API_KEY=${apiKey}`}
                language="python"
                newLines={[]}
                oldLines={[]}
                minHeight={false}
              />
            </div>
            <div className="flex flex-col">
              <p className="text-md text-gray-700 font-light">
                Step 3: Replace the import and use openai you would normally
              </p>
              <DiffHighlight
                code={`
- const { Configuration, OpenAIApi } = require("openai");
      
+ const { HeliconeAsyncConfiguration as Configuration, HeliconeAsyncOpenAIApi as OpenAIApi } = require("helicone");
                  `}
                language="python"
                newLines={[2]}
                oldLines={[0]}
                minHeight={false}
              />
            </div>
          </div>
        )}
        {lang === "python" && (
          <div className="flex flex-col space-y-8 py-8">
            <div className="flex flex-col">
              <p className="text-md text-gray-700 font-light">
                Step 1: Install the Helicone package
              </p>
              <DiffHighlight
                code={`pip install helicone`}
                language="bash"
                newLines={[]}
                oldLines={[]}
                minHeight={false}
              />
            </div>
            <div className="flex flex-col">
              <p className="text-md text-gray-700 font-light">
                Step 2: Add HELICONE_API_KEY to your environment variables.
              </p>
              <DiffHighlight
                code={`export HELICONE_API_KEY=${apiKey}`}
                language="python"
                newLines={[]}
                oldLines={[]}
                minHeight={false}
              />
            </div>
            <div className="flex flex-col">
              <p className="text-md text-gray-700 font-light">
                Step 3: Replace the import and use openai you would normally
              </p>
              <DiffHighlight
                code={`
- from openai import openai
      
+ from helicone.openai_async import openai
                  `}
                language="python"
                newLines={[2]}
                oldLines={[0]}
                minHeight={false}
              />
            </div>
          </div>
        )} */}
      </Tab.Group>
    </div>
  );
};

export default AnthropicProxy;
