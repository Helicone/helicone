import React from "react";
import { DiffHighlight } from "@/components/templates/welcome/diffHighlight";

export const RateLimitVisual = () => {
  const code = `"Helicone-RateLimit-Policy": "10;w=1000;u=cents;s=user"`;

  return (
    <div className="w-full md:w-[568.25px] h-[346.64px] relative rounded-[22.28px]">
      {/* Background Image with floating elements */}
      <img
        src="/static/featureUpgrade/custom-rate-limit.webp"
        alt="Rate limit background"
        className="w-full h-full object-cover"
      />

      {/* Code Block Overlay */}
      <div className="absolute inset-0 flex items-center justify-center translate-y-2">
        <DiffHighlight
          code={code}
          language="typescript"
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
