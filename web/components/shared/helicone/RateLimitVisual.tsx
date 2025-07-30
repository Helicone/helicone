import React from "react";
import { DiffHighlight } from "@/components/templates/welcome/diffHighlight";

export const RateLimitVisual = () => {
  const code = `"Helicone-RateLimit-Policy": "10;w=1000;u=cents;s=user"`;

  return (
    <div className="relative h-[346.64px] w-full rounded-xl bg-[hsl(var(--card))] md:w-[568.25px]">
      {/* Background Image with floating elements */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/static/featureUpgrade/custom-rate-limit.webp"
        alt="Rate limit background"
        className="h-full w-full rounded-xl object-cover"
      />

      {/* Code Block Overlay */}
      <div className="absolute inset-0 flex translate-y-2 items-center justify-center">
        <DiffHighlight
          code={code}
          language="typescript"
          newLines={[]}
          oldLines={[]}
          minHeight={false}
          maxHeight={false}
          textSize="md"
          className="rounded-lg bg-[hsl(var(--card))] [&_pre]:py-4"
          marginTop={false}
        />
      </div>
    </div>
  );
};
