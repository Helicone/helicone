import { TabGroup, TabList, Tab, TabPanels, TabPanel } from "@tremor/react";
import HcButton from "../../../ui/hcButton";
import { DiffHighlight } from "../diffHighlight";
import Link from "next/link";

interface FeaturesProps {
  apiKey?: string;
  previousStep: () => void;
  nextStep: () => void;
}

const Features = (props: FeaturesProps) => {
  const { apiKey = "{HELICONE_API_KEY}", previousStep, nextStep } = props;

  return (
    <div id="content" className="w-full flex flex-col">
      <div className="flex flex-col p-4">
        <h2 className="text-2xl font-semibold">Explore features and tooling</h2>

        <p className="text-sm pt-1 pb-4">
          Learn more about our other features in our{" "}
          <Link
            className="underline text-blue-500"
            href="https://docs.helicone.ai/"
            target="_blank"
            rel="noopener noreferrer"
          >
            documentation
          </Link>
          .
        </p>
        <TabGroup>
          <TabList className="mt-4" variant="solid">
            <Tab className="flex flex-col text-left">
              <p className="font-semibold text-md xl:text-lg">
                Custom Properties
              </p>
              <p className="text-xs xl:text-sm pt-1">
                Label and segment your requests
              </p>
            </Tab>
            <Tab className="flex flex-col text-left">
              <p className="font-semibold text-md xl:text-lg">
                Prompt Templating
              </p>
              <p className="text-xs xl:text-sm pt-1">
                Version and visualize prompts
              </p>
            </Tab>
            <Tab className="flex flex-col text-left">
              <p className="font-semibold text-md xl:text-lg">Caching</p>
              <p className="text-xs xl:text-sm pt-1">
                Increase performance and save costs
              </p>
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <DiffHighlight
                code={`
import { OpenAI } from "openai";

const configuration = {
  apiKey: process.env.OPENAI_API_KEY,
  basePath: "https://oai.helicone.ai/v1",
  defaultHeaders: {
    "Helicone-Auth": "Bearer ${apiKey}",
    "Helicone-Property-Session": "24",
    "Helicone-Property-Conversation": "support_issue_2",
    "Helicone-Property-App": "mobile",
  },
};

const openai = new OpenAI(configuration);
`}
                language={"typescript"}
                newLines={[7, 8, 9]}
                oldLines={[]}
                minHeight={false}
              />
            </TabPanel>
            <TabPanel>
              <DiffHighlight
                code={`
import { hprompt } from "@helicone/helicone";
 
const chatCompletion = await openai.chat.completions.create(
  {
    messages: [
      {
        role: "user",
        // Add hprompt to any string, and nest any variable in additional brackets \`{}\`
        content: hprompt\`Write a story about \${{ scene }}\`,
      },
    ],
    model: "gpt-3.5-turbo",
  },
  {
    // Add Prompt Id Header
    headers: {
      "Helicone-Prompt-Id": "prompt_story",
    },
  }
);
 `}
                language={"typescript"}
                newLines={[]}
                oldLines={[]}
                minHeight={false}
              />
            </TabPanel>
            <TabPanel>
              <DiffHighlight
                code={`
import { OpenAI } from "openai";

const configuration = {
  apiKey: process.env.OPENAI_API_KEY,
  basePath: "https://oai.helicone.ai/v1",
  defaultHeaders: {
    "Helicone-Auth": "Bearer ${apiKey}",
    "Helicone-Cache-Enabled": "true", // add this header and set to true
  },
};

const openai = new OpenAI(configuration);
`}
                language={"typescript"}
                newLines={[7]}
                oldLines={[]}
                minHeight={false}
              />
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>
      <Link
        href={"https://helicone.ai/community"}
        className="text-blue-500 underline text-center p-4"
        target="_blank"
        rel="noopener noreferrer"
      >
        Explore our many integrations 🚀
      </Link>

      <div className="flex items-center justify-between p-4">
        <HcButton
          variant={"secondary"}
          size={"sm"}
          title={"Back"}
          onClick={previousStep}
        />
        <HcButton
          variant={"primary"}
          size={"sm"}
          title={"Send first event"}
          onClick={() => {
            nextStep();
          }}
        />
      </div>
    </div>
  );
};

export default Features;
