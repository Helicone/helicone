import React from "react";
import { ChevronDown } from "lucide-react";

interface HeroSectionProps {
  organizationName?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  organizationName,
}) => {
  // Don't display "My Organization" - it's the default name
  const showOrgName =
    organizationName && organizationName !== "My Organization";

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
      {/* Giant 2025 backdrop */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
        aria-hidden="true"
      >
        <span
          className="select-none text-[35vw] font-bold leading-none text-white/[0.08]"
          style={{ fontFamily: "Imbue, Georgia, serif" }}
        >
          2025
        </span>
      </div>

      <div className="relative flex flex-col items-center gap-6">
        {/* Main heading */}
        <h1
          className="text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl"
          style={{ fontFamily: "Imbue, Georgia, serif" }}
        >
          Your Helicone Wonderland
        </h1>

        {/* Organization name - only show if not default */}
        {showOrgName && (
          <p
            className="text-xl italic text-[#0DA5E8] underline decoration-[#0DA5E8]/50 underline-offset-4 sm:text-2xl"
            style={{ fontFamily: "Imbue, Georgia, serif" }}
          >
            {organizationName}
          </p>
        )}

      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-12 flex animate-bounce flex-col items-center gap-2">
        <span className="text-sm text-white/50">Scroll to explore</span>
        <ChevronDown className="text-white/50" size={24} />
      </div>
    </section>
  );
};
