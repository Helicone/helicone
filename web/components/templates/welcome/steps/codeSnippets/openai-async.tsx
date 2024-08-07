import { Tab } from "@headlessui/react";
import { useState } from "react";
import { clsx } from "../../../../shared/clsx";
import { DiffHighlight } from "../../diffHighlight";

interface OpenAIAsyncProps {
  apiKey: string;
}

const NAMES = {
  typescript: "Node.js",
  python: "Python",
};

const OpenAIAsync = (props: OpenAIAsyncProps) => {
  const { apiKey } = props;

  const [lang, setLang] = useState<keyof typeof NAMES>("typescript");

  return (
    <div className="w-full flex flex-col">
      <Tab.Group defaultIndex={0}>
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
        {lang === "typescript" && (
          <div className="flex flex-col space-y-6 pt-8 overflow-auto max-h-[50vh]">
            <div className="flex flex-col">
              <p className="text-sm text-gray-700 font-light">
                Step 1: Install the Helicone package
              </p>
              <DiffHighlight
                code={`npm install helicone`}
                language="typescript"
                newLines={[]}
                oldLines={[]}
                minHeight={false}
              />
            </div>
            <div className="flex flex-col">
              <p className="text-sm text-gray-700 font-light">
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
              <p className="text-sm text-gray-700 font-light">
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
          <div className="flex flex-col space-y-6 pt-8 overflow-auto max-h-[50vh]">
            <div className="flex flex-col">
              <p className="text-sm text-gray-700 font-light">
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
              <p className="text-sm text-gray-700 font-light">
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
              <p className="text-sm text-gray-700 font-light">
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
        )}
      </Tab.Group>
    </div>
  );
};

export default OpenAIAsync;
