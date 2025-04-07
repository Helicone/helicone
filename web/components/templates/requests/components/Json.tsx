import { MappedLLMRequest } from "@/packages/llm-mapper/types";
import { JsonRenderer } from "./chatComponent/single/JsonRenderer";

interface JsonProps {
  mapperContent: MappedLLMRequest;
  className?: string;
}

export default function Json({ mapperContent, className }: JsonProps) {
  return (
    <div className={`w-full h-full flex flex-col text-sm ${className}`}>
      <div className="h-12 w-full flex flex-row items-center justify-between shrink-0 px-4 sticky top-0 bg-white dark:bg-black z-10 shadow-sm">
        <h2 className="text-secondary font-medium capitalize">Request</h2>
      </div>
      <div className="p-4 pb-4 border-b border-border">
        <JsonRenderer
          data={JSON.parse(JSON.stringify(mapperContent.raw.request))}
        />
      </div>
      <div className="h-12 w-full flex flex-row items-center justify-between shrink-0 px-4 sticky top-0 bg-white dark:bg-black z-10 shadow-sm">
        <h2 className="text-secondary font-medium capitalize">Response</h2>
      </div>
      <div className="p-4 pb-4 border-b border-border">
        <JsonRenderer
          data={JSON.parse(JSON.stringify(mapperContent.raw.response))}
        />
      </div>
    </div>
  );
}
