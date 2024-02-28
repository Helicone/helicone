import { CheckIcon } from "@heroicons/react/20/solid";
import { clsx } from "../../../shared/clsx";
import { DiffHighlight } from "../../welcome/diffHighlight";

const steps = [
  {
    name: "Step 1",
    description: "Change the base url to point to Helicone",
    href: "#",
    status: "complete",
    codeBlock: (
      <div className="w-full flex flex-col">
        <DiffHighlight
          code={`
from openai import OpenAI

client = OpenAI(
  api_key={{OPENAI_API_KEY}},
  base_url="http://oai.hconeai.com/v1", 
  default_headers= { 
    "Helicone-Auth": f"Bearer {{HELICONE_API_KEY}}",
  }
)
        `}
          language={"python"}
          newLines={[4, 6]}
          oldLines={[]}
          minHeight={false}
          textSize="md"
        />
        <i className="text-gray-500 text-xs text-center pt-2">
          Example Python integration with OpenAI
        </i>
      </div>
    ),
  },
  {
    name: "Step 2",
    description: "That's it!",
    href: "#",
    status: "complete",
    codeBlock: <></>,
  },
];

const Steps = () => {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="overflow-hidden">
        {steps.map((step, stepIdx) => (
          <li
            key={step.name}
            className={clsx(
              stepIdx !== steps.length - 1 ? "pb-8" : "",
              "relative"
            )}
          >
            <>
              {stepIdx !== steps.length - 1 ? (
                <div
                  className="absolute left-2 sm:left-4 top-4 -ml-px mt-0.5 h-full w-0.5 bg-cyan-500"
                  aria-hidden="true"
                />
              ) : null}
              <div className="group relative flex items-start">
                <span className="flex h-8 items-center">
                  <span className="relative z-10 flex h-4 w-4 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-cyan-500">
                    <CheckIcon
                      className="h-4 w-4 text-white"
                      aria-hidden="true"
                    />
                  </span>
                </span>
                <span className="ml-4 flex min-w-0 flex-col">
                  <span className="text-md font-medium text-cyan-300">
                    {step.name}
                  </span>
                  <span className="text-xl text-white font-semibold">
                    {step.description}
                  </span>
                  <span className="mt-1">{step.codeBlock}</span>
                </span>
              </div>
            </>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Steps;
