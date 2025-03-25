import GlassHeader from "@/components/shared/universal/GlassHeader";
import { MappedLLMRequest } from "@/packages/llm-mapper/types";
import { JsonRenderer } from "./chatComponent/single/JsonRenderer";

interface JsonProps {
  mapperContent: MappedLLMRequest;
  className?: string;
}

export default function Json({ mapperContent, className }: JsonProps) {
  return (
    <div className={`w-full h-full flex flex-col ${className}`}>
      <GlassHeader className="h-14 shrink-0 px-4">
        <h2 className="text-secondary font-medium capitalize">Request</h2>
      </GlassHeader>
      <div className="px-4 pb-4 border-b border-border">
        <JsonRenderer
          data={JSON.parse(JSON.stringify(mapperContent.raw.request))}
        />
      </div>
      <GlassHeader className="h-14 shrink-0 px-4">
        <h2 className="text-secondary font-medium capitalize">Response</h2>
      </GlassHeader>
      <div className="px-4 pb-4 border-b border-border">
        <JsonRenderer
          data={JSON.parse(JSON.stringify(mapperContent.raw.response))}
        />
      </div>
    </div>
  );
}
