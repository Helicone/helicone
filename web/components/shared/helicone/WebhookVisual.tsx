import React from "react";
import { Button } from "@/components/ui/button";
import { PlayIcon, PlusIcon } from "lucide-react";
import { DiffHighlight } from "@/components/templates/welcome/diffHighlight";

const codeExample = `export async function POST(request: Request) {
  // ... Custom logic
  return Response.json({
    scores: {
      "Was Success": true,
      "Impact": 8.6
    }
  })
}`;

export const WebhookVisual = () => {
  return (
    <div className="w-full md:w-[568.25px] h-full relative rounded-lg overflow-hidden">
      {/* Background Image */}
      <img
        src="/static/featureUpgrade/webhook.webp"
        alt="Webhook"
        className="w-full h-full object-cover"
      />

      {/* Code Section with Transparent Background */}
      <div className="absolute inset-0 flex items-center justify-center mt-36">
        <DiffHighlight
          code={codeExample}
          language="javascript"
          newLines={[]}
          oldLines={[]}
          minHeight={false}
          maxHeight={false}
          textSize="md"
          className="bg-[#1a1b26] rounded-lg [&_pre]:py-4"
          marginTop={false}
        />
      </div>
    </div>
  );
};
