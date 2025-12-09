import React, { useEffect, useState, useRef } from "react";
import { Trophy, Medal, Award, Cpu } from "lucide-react";

interface FavoriteModelsSectionProps {
  models: Array<{ model: string; count: number }>;
  totalRequests: number;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 0:
      return <Trophy className="text-yellow-400" size={32} />;
    case 1:
      return <Medal className="text-gray-300" size={28} />;
    case 2:
      return <Award className="text-amber-600" size={28} />;
    default:
      return <Cpu className="text-[#0DA5E8]" size={24} />;
  }
};

const formatModelName = (model: string): string => {
  // Truncate long model names
  if (model.length > 30) {
    return model.slice(0, 27) + "...";
  }
  return model;
};

interface ModelBarProps {
  model: { model: string; count: number };
  index: number;
  totalRequests: number;
  isVisible: boolean;
  animationDelay: number;
}

const ModelBar: React.FC<ModelBarProps> = ({
  model,
  index,
  totalRequests,
  isVisible,
  animationDelay,
}) => {
  const [displayCount, setDisplayCount] = useState(0);
  const [barWidth, setBarWidth] = useState(0);
  const percentage = (model.count / totalRequests) * 100;

  // Animate count up
  useEffect(() => {
    if (!isVisible) {
      setDisplayCount(0);
      setBarWidth(0);
      return;
    }

    // Delay based on index
    const timer = setTimeout(() => {
      // Animate count
      const duration = 1500;
      const steps = 40;
      const stepDuration = duration / steps;
      const increment = model.count / steps;

      let currentStep = 0;
      const countTimer = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setDisplayCount(model.count);
          clearInterval(countTimer);
        } else {
          setDisplayCount(Math.floor(increment * currentStep));
        }
      }, stepDuration);

      // Animate bar width
      setBarWidth(Math.min(percentage, 100));

      return () => clearInterval(countTimer);
    }, animationDelay);

    return () => clearTimeout(timer);
  }, [isVisible, model.count, percentage, animationDelay]);

  return (
    <div className="relative overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm">
      {/* Progress bar background - animated */}
      <div
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#0DA5E8]/20 to-[#0DA5E8]/5 transition-all duration-1000 ease-out"
        style={{ width: `${barWidth}%` }}
      />

      <div className="relative flex items-center gap-6 p-6 sm:p-8">
        {/* Rank icon */}
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center bg-white/5">
          {getRankIcon(index)}
        </div>

        {/* Model info */}
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
          <span className="text-sm text-white/50">#{index + 1} Most Used</span>
          <span
            className="w-full truncate text-left text-xl font-semibold text-white sm:text-2xl"
            title={model.model}
          >
            {formatModelName(model.model)}
          </span>
        </div>

        {/* Stats */}
        <div className="flex flex-shrink-0 flex-col items-end gap-1">
          <span className="text-2xl font-bold text-white">
            {displayCount.toLocaleString()}
          </span>
          <span className="text-sm text-white/50">
            {percentage.toFixed(1)}% of requests
          </span>
        </div>
      </div>
    </div>
  );
};

export const FavoriteModelsSection: React.FC<FavoriteModelsSectionProps> = ({
  models,
  totalRequests,
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
            style={{ fontFamily: "Imbue, Georgia, serif" }}
          >
            Your Favorite Models
          </h2>
          <p className="text-lg text-white/60">
            The models you relied on most in 2025
          </p>
        </div>

        {/* Model cards */}
        <div className="flex w-full flex-col gap-6">
          {models.map((model, index) => (
            <ModelBar
              key={model.model}
              model={model}
              index={index}
              totalRequests={totalRequests}
              isVisible={isVisible}
              animationDelay={index * 200} // Stagger by 200ms
            />
          ))}
        </div>
      </div>
    </section>
  );
};
