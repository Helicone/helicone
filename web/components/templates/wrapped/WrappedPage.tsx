import React from "react";
import { useRouter } from "next/router";
import { useOrg } from "@/components/layout/org/organizationContext";
import { useWrapped } from "./useWrapped";
import { WinterBackground } from "./WinterBackground";
import { HeroSection } from "./sections/HeroSection";
import { TotalRequestsSection } from "./sections/TotalRequestsSection";
import { FavoriteProvidersSection } from "./sections/FavoriteProvidersSection";
import { FavoriteModelsSection } from "./sections/FavoriteModelsSection";
import { TotalTokensSection } from "./sections/TotalTokensSection";
import { RequestSpotlightSection } from "./sections/RequestSpotlightSection";
import { ThankYouSection } from "./sections/ThankYouSection";
import { Loader2, ArrowLeft, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

// Capitalize provider name for display
const capitalizeProvider = (provider: string): string => {
  const names: Record<string, string> = {
    OPENAI: "OpenAI",
    ANTHROPIC: "Anthropic",
    AZURE: "Azure OpenAI",
    GOOGLE: "Google AI",
    GROQ: "Groq",
    MISTRAL: "Mistral AI",
    OPENROUTER: "OpenRouter",
    BEDROCK: "AWS Bedrock",
  };
  if (!provider) return provider;
  return (
    names[provider.toUpperCase()] ||
    provider.charAt(0).toUpperCase() + provider.slice(1).toLowerCase()
  );
};

export const WrappedPage: React.FC = () => {
  const router = useRouter();
  const org = useOrg();
  const { data: stats, isLoading, error } = useWrapped();

  // Loading state
  if (isLoading) {
    return (
      <div className="relative min-h-screen">
        <WinterBackground />
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-white" />
          <p className="mt-4 text-lg text-white/70">
            Loading your 2025 recap...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="relative min-h-screen">
        <WinterBackground />
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
          <div className="text-6xl">:(</div>
          <h1 className="text-2xl font-bold text-white">
            Something went wrong
          </h1>
          <p className="text-white/70">
            We couldn&apos;t load your 2025 recap. Please try again later.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // No data state
  if (!stats || stats.totalRequests === 0) {
    return (
      <div className="relative min-h-screen">
        <WinterBackground />
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
          <Gift className="h-16 w-16 text-[#0DA5E8]" />
          <h1 className="text-3xl font-bold text-white">
            Your 2025 Journey Awaits
          </h1>
          <p className="max-w-md text-lg text-white/70">
            Start making requests with Helicone to see your year in review
            stats here.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <WinterBackground />

      {/* Content */}
      <div className="relative z-10">
        {/* Back button */}
        <div className="fixed left-6 top-6 z-20">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="text-white/70 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={16} className="mr-2" />
            Dashboard
          </Button>
        </div>

        {/* Sections */}
        <HeroSection organizationName={org?.currentOrg?.name} />
        <TotalRequestsSection totalRequests={stats.totalRequests} />

        {stats.topProviders.length > 0 && (
          <FavoriteProvidersSection
            providers={stats.topProviders}
            totalRequests={stats.totalRequests}
          />
        )}

        {stats.topModels.length > 0 && (
          <FavoriteModelsSection
            models={stats.topModels}
            totalRequests={stats.totalRequests}
          />
        )}

        <TotalTokensSection tokens={stats.totalTokens} />

        {stats.mostExpensiveRequest && (
          <RequestSpotlightSection request={stats.mostExpensiveRequest} />
        )}

        {/* Thank You Section */}
        <ThankYouSection />
      </div>
    </div>
  );
};
