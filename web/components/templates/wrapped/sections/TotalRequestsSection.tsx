import React, { useEffect, useState, useRef } from "react";

interface TotalRequestsSectionProps {
  totalRequests: number;
}

const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

const getCheekyMessage = (
  count: number
): { message: string; mood: "sad" | "happy" | "excited" } => {
  if (count === 0) {
    return {
      message:
        "Looks like you're just getting started. Your AI journey awaits!",
      mood: "sad",
    };
  }
  if (count < 10000) {
    return {
      message:
        "You're on your way! Every request is a step toward something great.",
      mood: "happy",
    };
  }
  return {
    message: "You're building something amazing...thanks for choosing us!",
    mood: "excited",
  };
};

// Image paths for different moods
// Place images at:
// /web/public/assets/wrapped/mood-sad.png
// /web/public/assets/wrapped/mood-happy.png
// /web/public/assets/wrapped/mood-excited.png
const getMoodImage = (mood: "sad" | "happy" | "excited"): string => {
  return `/assets/wrapped/mood-${mood}.png`;
};

export const TotalRequestsSection: React.FC<TotalRequestsSectionProps> = ({
  totalRequests,
}) => {
  const [displayCount, setDisplayCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const { message, mood } = getCheekyMessage(totalRequests);

  // Intersection observer to trigger animation when section comes into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDisplayCount(0); // Reset count to animate from 0
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      },
      { threshold: 0.5 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Animate count up when visible
  useEffect(() => {
    if (!isVisible || totalRequests === 0) return;

    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;
    const increment = totalRequests / steps;

    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayCount(totalRequests);
        clearInterval(timer);
      } else {
        setDisplayCount(Math.floor(increment * currentStep));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [isVisible, totalRequests]);

  // Days in 2025 so far (from Jan 1)
  const daysInYear = Math.max(
    1,
    Math.floor(
      (new Date().getTime() - new Date("2025-01-01").getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
  const avgRequestsPerDay = Math.round(totalRequests / daysInYear);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen flex-col items-center justify-center px-6 py-20"
    >
      <div className="flex w-full max-w-5xl flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-between">
        {/* Left side - Image */}
        <div className="flex flex-1 items-center justify-center">
          <div className="relative flex h-64 w-64 items-center justify-center sm:h-80 sm:w-80">
            <img
              src={getMoodImage(mood)}
              alt={`${mood} mood illustration`}
              className="max-h-full max-w-full object-contain"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
              onError={(e) => {
                // Fallback if image doesn't exist
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        </div>

        {/* Right side - Content */}
        <div className="flex flex-1 flex-col items-center gap-8 text-center lg:items-start lg:text-left">
          {/* Title */}
          <h2
            className="text-5xl font-bold text-white sm:text-6xl md:text-7xl"
            style={{ fontFamily: "Imbue, Georgia, serif" }}
          >
            Total Requests
          </h2>

          {/* Count */}
          <div className="flex flex-col gap-2">
            <span className="text-6xl font-bold text-white sm:text-7xl md:text-8xl">
              {formatNumber(displayCount)}
            </span>
            <span className="text-xl text-white/70">requests made in 2025</span>
          </div>

          {/* Cheeky message */}
          <p className="max-w-md text-lg italic text-white/60">{message}</p>

          {/* Average per day - frosted glass */}
          <div className="border border-white/20 bg-white/10 px-6 py-4 backdrop-blur-md">
            <p className="text-white/80">
              That&apos;s an average of{" "}
              <span className="font-semibold text-[#0DA5E8]">
                {avgRequestsPerDay.toLocaleString()}
              </span>{" "}
              requests per day
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
