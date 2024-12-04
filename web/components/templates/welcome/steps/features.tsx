import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DiffHighlight } from "../diffHighlight";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
        <Tabs defaultValue="properties">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="properties" className="flex flex-col text-left">
              <p className="font-semibold text-md xl:text-lg">
                Custom Properties
              </p>
              <p className="text-xs xl:text-sm">
                Label and segment your requests
              </p>
            </TabsTrigger>
            <TabsTrigger value="templating" className="flex flex-col text-left">
              <p className="font-semibold text-md xl:text-lg">
                Prompt Templating
              </p>
              <p className="text-xs xl:text-sm">
                Version and visualize prompts
              </p>
            </TabsTrigger>
            <TabsTrigger value="caching" className="flex flex-col text-left">
              <p className="font-semibold text-md xl:text-lg">Caching</p>
              <p className="text-xs xl:text-sm">
                Increase performance and save costs
              </p>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="properties">
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
            <p className="mt-4 text-sm text-gray-600">
              Custom Properties allow you to add metadata to your requests,
              enabling advanced segmentation and analysis. Tag requests with
              session IDs, conversation context, or application data for deeper
              insights into your AI application performance.
            </p>
          </TabsContent>
          <TabsContent value="templating">
            <DiffHighlight
              code={`
import { hpf } from "@helicone/prompts";
 
const chatCompletion = await openai.chat.completions.create(
  {
    messages: [
      {
        role: "user",
        // Add hpf to any string, and nest any variable in additional brackets \`{}\`
        content: hpf\`Write a story about \${{ scene: "OpenAI }}\`,
      },
    ],
    model: "gpt-4o",
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
            <p className="mt-4 text-sm text-gray-600">
              Prompt Templating helps you manage and version your prompts
              effectively. This feature allows you to create reusable templates,
              track changes, and optimize your prompts over time. Maintain
              consistency across your AI interactions and easily experiment with
              different prompt variations.
            </p>
          </TabsContent>
          <TabsContent value="caching">
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
            <p className="mt-4 text-sm text-gray-600">
              Caching saves you time and money by storing and reusing responses
              for identical requests. This feature reduces API calls, lowers
              costs, and improves response times, making your AI application
              more efficient and cost-effective.
            </p>
          </TabsContent>
        </Tabs>
      </div>
      <Link
        href={"https://helicone.ai/community"}
        className="text-blue-500 underline text-center p-4"
        target="_blank"
        rel="noopener noreferrer"
      >
        Explore our many integrations 🚀
      </Link>

      <div className="sticky bottom-12 p-4 flex items-center justify-between">
        <Button variant={"secondary"} size={"sm"} onClick={previousStep}>
          Back
        </Button>
        <Button
          size={"sm"}
          onClick={() => {
            nextStep();
          }}
        >
          Go to dashboard
        </Button>
      </div>
    </div>
  );
};

export default Features;
