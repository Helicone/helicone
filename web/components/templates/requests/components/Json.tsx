import { MappedLLMRequest } from "@helicone-package/llm-mapper/types";
import { JsonRenderer } from "./chatComponent/single/JsonRenderer";

interface JsonProps {
  mapperContent: MappedLLMRequest;
  className?: string;
}

export default function Json({ mapperContent, className }: JsonProps) {
  return (
    <div className={`flex h-full w-full flex-col text-sm ${className}`}>
      <div className="sticky top-0 z-10 flex h-12 w-full shrink-0 flex-row items-center justify-between bg-white px-4 shadow-sm dark:bg-black">
        <h2 className="font-medium capitalize text-secondary">Request</h2>
      </div>
      <div className="border-b border-border p-4 pb-4">
        <JsonRenderer
          data={JSON.parse(JSON.stringify(mapperContent.raw.request))}
        />
      </div>
      <div className="sticky top-0 z-10 flex h-12 w-full shrink-0 flex-row items-center justify-between bg-white px-4 shadow-sm dark:bg-black">
        <h2 className="font-medium capitalize text-secondary">Response</h2>
      </div>
      <div className="border-b border-border p-4 pb-4">
        <JsonRenderer
          data={JSON.parse(JSON.stringify(mapperContent.raw.response))}
        />
      </div>
    </div>
  );
}
