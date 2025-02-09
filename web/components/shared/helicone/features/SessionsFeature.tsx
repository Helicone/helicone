import { DiffHighlight } from "@/components/templates/welcome/diffHighlight";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Main visual component
export const SessionsFeatureVisual = () => {
  return (
    <div className="w-full h-full items-center flex lg:flex-row flex-col gap-12 justify-between">
      <div className="w-full flex-[3] xl:flex-[1]">
        <div className="w-full flex flex-col gap-4">
          {/* Badge Groups */}
          <div className="flex flex-wrap gap-4 md:justify-end justify-start">
            <div className="px-3.5 py-1 bg-sky-200 rounded-lg flex items-center justify-center">
              <span className="text-sky-700 text-md font-medium">LLM</span>
            </div>
            <div className="px-3.5 py-1 bg-slate-200 rounded-lg flex items-center justify-center">
              <span className="text-slate-700 text-md font-medium">Tool</span>
            </div>
            <div className="px-3.5 py-1 bg-orange-200 rounded-lg flex items-center justify-center">
              <span className="text-orange-700 text-md font-medium">
                Vector DB
              </span>
            </div>
            <div className="px-3.5 py-1 bg-blue-200 rounded-lg flex items-center justify-center">
              <span className="text-blue-700 text-md font-medium">Image</span>
            </div>
            <div className="px-3.5 py-1 bg-red-200 rounded-lg flex items-center justify-center">
              <span className="text-red-700 text-md font-medium">Threat</span>
            </div>
            <div className="px-3.5 py-1 bg-slate-200 rounded-lg flex items-center justify-center">
              <span className="text-slate-700 text-md font-medium">
                Assistant
              </span>
            </div>
            <div className="px-3.5 py-1 bg-slate-200 rounded-lg flex items-center justify-center">
              <span className="text-slate-700 text-md font-medium">
                Moderation
              </span>
            </div>
            <div className="px-3.5 py-1 bg-slate-200 rounded-lg sm:flex hidden items-center justify-center">
              <span className="text-slate-700 text-md font-medium">
                Embedding
              </span>
            </div>
          </div>

          {/* Code Block Section */}
          <div className="w-full max-w-[520px]">
            <div className="overflow-hidden rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.1)] [&_pre]:!rounded-none">
              <DiffHighlight
                code={`"Helicone-Session-Id": randomUUID(),
"Helicone-Session-Path": "/user-db-query",
"Helicone-Session-Name": "User DB Query",`}
                language="javascript"
                newLines={[]}
                oldLines={[]}
                minHeight={false}
                maxHeight={false}
                textSize="md"
                marginTop={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Text component
export const SessionsFeatureText = () => {
  return (
    <div className="w-full flex-col flex gap-4 md:gap-8 max-w-xl flex-1">
      <div className="h-full flex-col justify-start items-start gap-1 flex">
        <h3 className="text-slate-900 text-3xl font-semibold leading-normal">
          Start tracking with headers
        </h3>
        <p className="w-full text-slate-500 text-md font-normal leading-relaxed">
          Track your sessions and traces with 3 simple headers.
        </p>
      </div>

      <div className="flex flex-row gap-4 md:gap-16">
        <div className="flex-col w-full gap-4 flex">
          <div className="w-full flex-col gap-1 flex">
            <h4 className="text-slate-900 text-md font-medium leading-normal">
              Define hierarchy
            </h4>
            <p className="text-slate-500 text-sm font-normal leading-relaxed">
              A simple path syntax to define parent-child relationship.
            </p>
          </div>
          <Link
            href="https://docs.helicone.ai/features/sessions"
            target="_blank"
          >
            <Button
              variant="outline"
              size="sm"
              className="gap-2 w-fit text-slate-500"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5.83334 14.1667L14.1667 5.83334M14.1667 5.83334H7.50001M14.1667 5.83334V12.5"
                  stroke="currentColor"
                  strokeWidth="1.67"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              View docs
            </Button>
          </Link>
        </div>

        <div className="flex-col w-full gap-4 flex">
          <div className="w-full flex-col gap-1 flex">
            <h4 className="w-full text-slate-900 text-md font-medium leading-normal">
              Log everything
            </h4>
            <p className="w-full text-slate-500 text-sm font-normal leading-relaxed">
              Log any LLM, vector database and tool calls.
            </p>
          </div>
          <Link
            href="https://docs.helicone.ai/features/sessions"
            target="_blank"
          >
            <Button
              variant="outline"
              size="sm"
              className="gap-2 w-fit text-slate-500"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5.83334 14.1667L14.1667 5.83334M14.1667 5.83334H7.50001M14.1667 5.83334V12.5"
                  stroke="currentColor"
                  strokeWidth="1.67"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              View docs
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
