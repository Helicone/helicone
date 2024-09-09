import React from "react";
import { Button } from "@tremor/react";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/20/solid";
import { DiffHighlight } from "../../diffHighlight";
import HcBadge from "../../../ui/hcBadge";

interface SessionTrackingProps {
  previousStep: () => void;
  nextStep: () => void;
}

const SessionTracking: React.FC<SessionTrackingProps> = ({
  previousStep,
  nextStep,
}) => {
  return (
    <div className="flex flex-col space-y-4 max-w-2xl">
      <h2 className="text-2xl font-bold">Set up Session Tracking</h2>
      <HcBadge title="Beta" size="sm" />
      <p>
        Session tracking allows you to group related requests together.
        Here&apos;s how to implement it:
      </p>
      <ol className="list-decimal list-inside space-y-2">
        <li>Generate a unique session ID for each user session</li>
        <li>Add the &quot;Helicone-Session-Id&quot; header to your requests</li>
        <li>Optionally, add the &quot;Helicone-Session-Path&quot; header</li>
      </ol>
      <DiffHighlight
        code={`
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://oai.helicone.ai/v1",
  defaultHeaders: {
    "Helicone-Auth": "Bearer ${process.env.HELICONE_API_KEY}",
  },
});

const session = randomUUID();

openai.chat.completions.create(
  {
    messages: [
      {
        role: "user",
        content: "Generate an abstract for a course on space.",
      },
    ],
    model: "gpt-4",
  },
  {
    headers: {
      "Helicone-Session-Id": session,
      "Helicone-Session-Path": "/abstract",
    },
  }
);
`}
        language="typescript"
        newLines={[]}
        oldLines={[]}
      />
      <p>
        For more detailed information, check out our{" "}
        <a
          href="https://docs.helicone.ai/features/sessions"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          session tracking documentation
        </a>
        .
      </p>
      <div className="flex justify-between mt-4">
        <Button icon={ArrowLeftIcon} variant="secondary" onClick={previousStep}>
          Previous
        </Button>
        <Button icon={ArrowRightIcon} onClick={nextStep}>
          Next
        </Button>
      </div>
    </div>
  );
};

export default SessionTracking;
