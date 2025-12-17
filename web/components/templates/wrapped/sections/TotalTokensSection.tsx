import React, { useEffect, useState, useRef } from "react";
import { Zap, ArrowRight, ArrowLeft, Database, BookOpen } from "lucide-react";

interface TotalTokensSectionProps {
  tokens: {
    prompt: number;
    completion: number;
    cacheWrite: number;
    cacheRead: number;
    total: number;
  };
}

const formatNumber = (num: number): string => {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toLocaleString();
};

// Generate fun equivalents for token count
const getTokenEquivalents = (
  totalTokens: number
): Array<{ value: string; label: string }> => {
  const equivalents: Array<{ value: string; label: string }> = [];

  // 1 token ~ 4 characters, 1 word ~ 1.3 tokens
  // Average novel is ~80,000-100,000 words (~100,000 * 1.3 = 130,000 tokens)
  const tokensPerNovel = 130000;
  const novelCount = Math.round(totalTokens / tokensPerNovel);
  if (novelCount > 0) {
    equivalents.push({
      value: novelCount.toLocaleString(),
      label: novelCount === 1 ? "novel" : "novels",
    });
  }

  // Average tweet is ~15 words (~20 tokens)
  const tokensPerTweet = 20;
  const tweetCount = Math.round(totalTokens / tokensPerTweet);
  if (tweetCount > 0) {
    equivalents.push({
      value: formatNumber(tweetCount),
      label: "tweets",
    });
  }

  // Average Wikipedia article is ~3,000-4,000 words (~4,500 tokens)
  const tokensPerWikiArticle = 4500;
  const wikiCount = Math.round(totalTokens / tokensPerWikiArticle);
  if (wikiCount > 0) {
    equivalents.push({
      value: formatNumber(wikiCount),
      label: "Wikipedia articles",
    });
  }

  // Average email is ~75-100 words (~100 tokens)
  const tokensPerEmail = 100;
  const emailCount = Math.round(totalTokens / tokensPerEmail);
  if (emailCount > 0) {
    equivalents.push({
      value: formatNumber(emailCount),
      label: "emails",
    });
  }

  return equivalents.slice(0, 3); // Return top 3
};

interface AnimatedCounterProps {
  targetValue: number;
  isVisible: boolean;
  delay?: number;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  targetValue,
  isVisible,
  delay = 0,
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setDisplayValue(0);
      return;
    }

    const timer = setTimeout(() => {
      const duration = 1500;
      const steps = 40;
      const stepDuration = duration / steps;
      const increment = targetValue / steps;

      let currentStep = 0;
      const countTimer = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setDisplayValue(targetValue);
          clearInterval(countTimer);
        } else {
          setDisplayValue(Math.floor(increment * currentStep));
        }
      }, stepDuration);

      return () => clearInterval(countTimer);
    }, delay);

    return () => clearTimeout(timer);
  }, [isVisible, targetValue, delay]);

  return <>{formatNumber(displayValue)}</>;
};

export const TotalTokensSection: React.FC<TotalTokensSectionProps> = ({
  tokens,
}) => {
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

  const equivalents = getTokenEquivalents(tokens.total);

  // Calculate cache efficiency
  const cacheTokens = tokens.cacheWrite + tokens.cacheRead;
  const cacheRatio = tokens.total > 0 ? (cacheTokens / tokens.total) * 100 : 0;
  const isCacheEfficient = cacheRatio >= 50;

  // Efficiency messages for cache write/read
  const cacheWriteMessage = "Making good use!";
  const cacheReadMessage = "Very efficient...";

  const tokenBreakdown = [
    {
      label: "Prompt Tokens",
      value: tokens.prompt,
      icon: ArrowRight,
      color: "text-[#0DA5E8]",
      bgColor: "bg-[#0DA5E8]/20",
    },
    {
      label: "Completion Tokens",
      value: tokens.completion,
      icon: ArrowLeft,
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/20",
    },
    {
      label: "Cache Write",
      value: tokens.cacheWrite,
      icon: Database,
      color: "text-amber-400",
      bgColor: "bg-amber-400/20",
    },
    {
      label: "Cache Read",
      value: tokens.cacheRead,
      icon: BookOpen,
      color: "text-purple-400",
      bgColor: "bg-purple-400/20",
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center"
    >
      <div className="flex w-full max-w-4xl flex-col items-center gap-12">
        {/* Title */}
        <div className="flex flex-col items-center gap-4">
          <div className="bg-[#0DA5E8]/20 p-4">
            <Zap className="text-[#0DA5E8]" size={40} />
          </div>
          <h2
            className="text-5xl font-bold text-white sm:text-6xl md:text-7xl"
          >
            Token Usage
          </h2>
        </div>

        {/* Total tokens */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-6xl font-bold text-white sm:text-7xl md:text-8xl">
            <AnimatedCounter targetValue={tokens.total} isVisible={isVisible} />
          </span>
          <span className="text-xl text-white/70">total tokens processed</span>
        </div>

        {/* Fun equivalents */}
        {equivalents.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-4">
            {equivalents.map((equiv, index) => (
              <div
                key={equiv.label}
                className="border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-sm"
              >
                <p className="text-white/80">
                  {index === 0 ? "That's equivalent to " : "or "}
                  <span className="font-semibold text-[#0DA5E8]">
                    {equiv.value}
                  </span>{" "}
                  {equiv.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Breakdown */}
        <div className="mt-4 grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
          {tokenBreakdown.map((item, index) => {
            const Icon = item.icon;
            const isCacheWrite = item.label === "Cache Write";
            const isCacheRead = item.label === "Cache Read";
            const showEfficiencyMessage =
              (isCacheWrite || isCacheRead) && isCacheEfficient;
            const efficiencyMessage = isCacheWrite
              ? cacheWriteMessage
              : cacheReadMessage;

            return (
              <div
                key={item.label}
                className="relative flex flex-col items-center gap-3 border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
              >
                <div className={`p-3 ${item.bgColor}`}>
                  <Icon className={item.color} size={24} />
                </div>
                <span className="text-2xl font-bold text-white sm:text-3xl">
                  <AnimatedCounter
                    targetValue={item.value}
                    isVisible={isVisible}
                    delay={index * 100}
                  />
                </span>
                <span className="text-sm text-white/60">{item.label}</span>

                {/* Cache efficiency message */}
                {showEfficiencyMessage && (
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap border border-emerald-500/30 bg-emerald-500/20 px-2 py-1 text-xs text-emerald-400">
                    {efficiencyMessage}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Overall cache efficiency note */}
        {isCacheEfficient && (
          <div className="border border-emerald-500/30 bg-emerald-500/10 px-6 py-4 backdrop-blur-sm">
            <p className="text-emerald-400">
              Your cache hit ratio is{" "}
              <span className="font-bold">{cacheRatio.toFixed(1)}%</span> - you&apos;re
              saving tokens like a pro!
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
