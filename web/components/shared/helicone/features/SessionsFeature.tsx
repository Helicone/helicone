import { DiffHighlight } from "@/components/templates/welcome/diffHighlight";

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
