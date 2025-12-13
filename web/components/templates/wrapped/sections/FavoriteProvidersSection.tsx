import React, { useEffect, useState, useRef } from "react";
import { Trophy, Medal, Award, Cloud } from "lucide-react";

interface FavoriteProvidersSectionProps {
  providers: Array<{ provider: string; count: number }>;
  totalRequests: number;
}

// Capitalize a provider name properly (e.g., "anthropic" -> "Anthropic", "CUSTOM" -> "Custom")
const capitalizeProvider = (provider: string): string => {
  if (!provider) return provider;
  return provider.charAt(0).toUpperCase() + provider.slice(1).toLowerCase();
};

const providerDisplayName = (provider: string): string => {
  const names: Record<string, string> = {
    OPENAI: "OpenAI",
    ANTHROPIC: "Anthropic",
    AZURE: "Azure OpenAI",
    GOOGLE: "Google AI",
    COHERE: "Cohere",
    TOGETHER: "Together AI",
    GROQ: "Groq",
    MISTRAL: "Mistral AI",
    OPENROUTER: "OpenRouter",
    DEEPINFRA: "DeepInfra",
    PERPLEXITY: "Perplexity",
    ANYSCALE: "Anyscale",
    FIREWORKS: "Fireworks AI",
    REPLICATE: "Replicate",
    CLOUDFLARE: "Cloudflare",
    BEDROCK: "AWS Bedrock",
  };
  // Use mapped name if available, otherwise capitalize the provider name
  return names[provider.toUpperCase()] || capitalizeProvider(provider);
};

const getProviderLogo = (provider: string): string => {
  const logos: Record<string, string> = {
    OPENAI: "/assets/providers/openai.webp",
    ANTHROPIC: "/assets/providers/anthropic.webp",
    AZURE: "/assets/home/providers/azure.webp",
    GOOGLE: "/assets/home/providers/gemini.webp",
    GROQ: "/assets/home/providers/groq.png",
    MISTRAL: "/assets/home/providers/mistral.png",
    BEDROCK: "/assets/home/providers/bedrock.webp",
    OPENROUTER: "/assets/home/providers/openrouter.jpg",
    TOGETHER: "/assets/home/providers/together.png",
    DEEPINFRA: "/assets/home/providers/deepinfra.webp",
    PERPLEXITY: "/assets/home/providers/perplexity.png",
    COHERE: "/assets/home/providers/cohere.png",
    FIREWORKS: "/assets/home/providers/fireworks.png",
    REPLICATE: "/assets/home/providers/replicate.png",
    CLOUDFLARE: "/assets/home/providers/cloudflare.png",
  };
  return logos[provider.toUpperCase()] || "";
};

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 0:
      return <Trophy className="text-yellow-400" size={32} />;
    case 1:
      return <Medal className="text-gray-300" size={28} />;
    case 2:
      return <Award className="text-amber-600" size={28} />;
    default:
      return <Cloud className="text-[#0DA5E8]" size={24} />;
  }
};

const getRankLabel = (rank: number): string => {
  switch (rank) {
    case 0:
      return "#1";
    case 1:
      return "#2";
    case 2:
      return "#3";
    default:
      return `#${rank + 1}`;
  }
};

interface PodiumItemProps {
  provider: { provider: string; count: number };
  rank: number;
  totalRequests: number;
  isVisible: boolean;
  delay: number;
}

const PodiumItem: React.FC<PodiumItemProps> = ({
  provider,
  rank,
  totalRequests,
  isVisible,
  delay,
}) => {
  const [animatedHeight, setAnimatedHeight] = useState(0);
  const logo = getProviderLogo(provider.provider);

  // Target heights in pixels for animation
  const targetHeights = {
    0: { sm: 208, base: 176 }, // 1st place (h-44 = 176px, sm:h-52 = 208px)
    1: { sm: 160, base: 128 }, // 2nd place (h-32 = 128px, sm:h-40 = 160px)
    2: { sm: 128, base: 96 }, // 3rd place (h-24 = 96px, sm:h-32 = 128px)
  };

  const widths = {
    0: "w-28 sm:w-36",
    1: "w-24 sm:w-32",
    2: "w-24 sm:w-32",
  };
  const gradients = {
    0: "from-yellow-500/30 to-yellow-400/10",
    1: "from-gray-500/30 to-gray-400/10",
    2: "from-amber-700/30 to-amber-600/10",
  };
  const labelColors = {
    0: "text-yellow-400",
    1: "text-gray-400",
    2: "text-amber-600",
  };

  // Animate height when visible
  useEffect(() => {
    if (!isVisible) {
      setAnimatedHeight(0);
      return;
    }

    const timer = setTimeout(() => {
      // Use base height, CSS will handle responsive
      const targetHeight = targetHeights[rank as 0 | 1 | 2].base;
      setAnimatedHeight(targetHeight);
    }, delay);

    return () => clearTimeout(timer);
  }, [isVisible, delay, rank]);

  // Get the responsive target height
  const getResponsiveHeight = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 640) {
      return targetHeights[rank as 0 | 1 | 2].sm;
    }
    return targetHeights[rank as 0 | 1 | 2].base;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Bar container with fixed height for layout */}
      <div
        className={`relative ${widths[rank as 0 | 1 | 2]} flex items-end`}
        style={{
          height: `${targetHeights[rank as 0 | 1 | 2].sm}px`,
        }}
      >
        {/* Animated bar */}
        <div
          className={`${widths[rank as 0 | 1 | 2]} flex flex-col items-center justify-end border border-white/20 bg-gradient-to-t ${gradients[rank as 0 | 1 | 2]} px-4 pb-6 backdrop-blur-md transition-all duration-700 ease-out`}
          style={{
            height: isVisible ? `${getResponsiveHeight()}px` : "0px",
            opacity: isVisible ? 1 : 0,
            transitionDelay: `${delay}ms`,
            overflow: "hidden",
          }}
        >
          {logo ? (
            <img
              src={logo}
              alt={provider.provider}
              className="mb-2 h-10 w-10 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : null}
          {getRankIcon(rank)}
        </div>
      </div>
      <div
        className="flex flex-col items-center gap-1 transition-opacity duration-500"
        style={{
          opacity: isVisible ? 1 : 0,
          transitionDelay: `${delay + 300}ms`,
        }}
      >
        <span className={`text-sm ${labelColors[rank as 0 | 1 | 2]}`}>
          {getRankLabel(rank)}
        </span>
        <span
          className={`${rank === 0 ? "text-xl font-bold" : "text-lg font-semibold"} text-white`}
        >
          {providerDisplayName(provider.provider)}
        </span>
        <span className="text-sm text-white/60">
          {provider.count.toLocaleString()} requests
        </span>
        <span className="text-xs text-white/40">
          {((provider.count / totalRequests) * 100).toFixed(1)}%
        </span>
      </div>
    </div>
  );
};

export const FavoriteProvidersSection: React.FC<
  FavoriteProvidersSectionProps
> = ({ providers, totalRequests }) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Animation order: 3rd place (0ms) → 2nd place (300ms) → 1st place (600ms)
  const getDelay = (rank: number): number => {
    switch (rank) {
      case 2:
        return 0; // 3rd place first
      case 1:
        return 300; // 2nd place second
      case 0:
        return 600; // 1st place last
      default:
        return 0;
    }
  };

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center"
    >
      <div className="flex w-full max-w-4xl flex-col items-center gap-12">
        {/* Title */}
        <div className="flex flex-col items-center gap-4">
          <h2
            className="text-5xl font-bold text-white sm:text-6xl md:text-7xl"
          >
            Your Favorite Providers
          </h2>
          <p className="text-lg text-white/60">
            The LLM providers that powered your year
          </p>
        </div>

        {/* Podium */}
        <div className="flex w-full items-end justify-center gap-4 sm:gap-8">
          {/* Second place (left) */}
          {providers[1] && (
            <PodiumItem
              provider={providers[1]}
              rank={1}
              totalRequests={totalRequests}
              isVisible={isVisible}
              delay={getDelay(1)}
            />
          )}

          {/* First place (center) */}
          {providers[0] && (
            <PodiumItem
              provider={providers[0]}
              rank={0}
              totalRequests={totalRequests}
              isVisible={isVisible}
              delay={getDelay(0)}
            />
          )}

          {/* Third place (right) */}
          {providers[2] && (
            <PodiumItem
              provider={providers[2]}
              rank={2}
              totalRequests={totalRequests}
              isVisible={isVisible}
              delay={getDelay(2)}
            />
          )}
        </div>
      </div>
    </section>
  );
};
