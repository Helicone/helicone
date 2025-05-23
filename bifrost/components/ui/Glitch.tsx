"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface GlitchProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number; // 0-1, controls how intense the glitch is
  frequency?: number; // milliseconds between glitches
  duration?: number; // milliseconds the glitch lasts
  disabled?: boolean; // disable the glitch effect
}

const Glitch = ({
  children,
  className,
  intensity = 0.7,
  frequency = 3000,
  duration = 600,
  disabled = false,
}: GlitchProps) => {
  const [isGlitching, setIsGlitching] = useState(false);
  const [corruptedText, setCorruptedText] = useState("");
  const [glitchIntensity, setGlitchIntensity] = useState(0);

  const corruptChars = "█▓▒░▀▄▌▐▆▇■□▪▫◆◇◢◣◤◥";

  const generateCorruption = (text: string) => {
    return text
      .split("")
      .map((char: string) => {
        if (Math.random() < intensity * 0.3) {
          return corruptChars[Math.floor(Math.random() * corruptChars.length)];
        }
        return char;
      })
      .join("");
  };

  const textContent =
    typeof children === "string" ? children : children?.toString() || "";

  useEffect(() => {
    if (disabled) return;

    const interval = setInterval(() => {
      setIsGlitching(true);
      setGlitchIntensity(1);

      // Multiple corruption phases
      let phase = 0;
      const corruptionInterval = setInterval(() => {
        setCorruptedText(generateCorruption(textContent));
        phase++;

        if (phase >= 8) {
          clearInterval(corruptionInterval);
          setTimeout(() => {
            setCorruptedText("");
          }, 100);
        }
      }, 50);

      setTimeout(() => {
        setGlitchIntensity(0);
        setIsGlitching(false);
      }, duration);
    }, frequency);

    return () => clearInterval(interval);
  }, [textContent, intensity, frequency, duration, disabled]);

  if (disabled) {
    return <span className={className}>{children}</span>;
  }

  return (
    <>
      <style jsx>{`
        @keyframes digital-glitch {
          0%,
          100% {
            transform: translate(0) skew(0deg);
          }
          10% {
            transform: translate(-2px, 1px) skew(-2deg);
          }
          20% {
            transform: translate(1px, -1px) skew(1deg);
          }
          30% {
            transform: translate(-1px, 2px) skew(-1deg);
          }
          40% {
            transform: translate(2px, -2px) skew(2deg);
          }
          50% {
            transform: translate(-2px, 1px) skew(-2deg);
          }
          60% {
            transform: translate(1px, 1px) skew(1deg);
          }
          70% {
            transform: translate(-1px, -1px) skew(-1deg);
          }
          80% {
            transform: translate(2px, 2px) skew(2deg);
          }
          90% {
            transform: translate(-2px, -1px) skew(-2deg);
          }
        }

        @keyframes scan-lines {
          0% {
            transform: translateY(0px);
          }
          100% {
            transform: translateY(4px);
          }
        }

        @keyframes static-0 {
          0%,
          100% {
            opacity: 0;
          }
          50% {
            opacity: 0.3;
          }
        }

        @keyframes static-1 {
          0%,
          100% {
            opacity: 0;
          }
          25% {
            opacity: 0.2;
          }
          75% {
            opacity: 0.1;
          }
        }

        @keyframes static-2 {
          0%,
          100% {
            opacity: 0;
          }
          33% {
            opacity: 0.25;
          }
          66% {
            opacity: 0.15;
          }
        }

        .animate-digital-glitch {
          animation: digital-glitch 0.6s linear infinite;
        }
      `}</style>

      <span
        className={cn("relative inline-block overflow-hidden", className)}
        style={{
          // Reserve space to prevent layout shifts
          minWidth: `${textContent.length}ch`,
        }}
      >
        {/* Main text */}
        <span
          className={cn(
            "relative inline-block transition-all duration-100",
            isGlitching && "animate-digital-glitch"
          )}
          style={{
            filter: isGlitching
              ? `
                brightness(${1.2 + glitchIntensity * 0.5 * intensity})
                contrast(${1.5 + glitchIntensity * 0.5 * intensity})
                hue-rotate(${Math.random() * 30 - 15}deg)
                saturate(${1.5 + glitchIntensity * 0.5 * intensity})
              `
              : "none",
            textShadow: isGlitching
              ? `
                ${3 * intensity}px 0 #ff0080,
                ${-3 * intensity}px 0 #00ffff,
                ${6 * intensity}px 0 #ff0000,
                ${-6 * intensity}px 0 #0080ff,
                0 0 ${20 * intensity}px currentColor
              `
              : "none",
          }}
        >
          {isGlitching && corruptedText ? corruptedText : children}
        </span>

        {/* Scan lines overlay */}
        {isGlitching && (
          <>
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `
                  repeating-linear-gradient(
                    0deg,
                    transparent 0px,
                    rgba(255, 255, 255, ${0.1 * intensity}) 1px,
                    transparent 2px,
                    transparent 4px
                  )
                `,
                animation: "scan-lines 0.1s linear infinite",
              }}
            />

            {/* RGB separation layers */}
            <span
              className="absolute top-0 left-0 text-red-500"
              style={{
                opacity: 0.6 * intensity,
                transform: `translateX(${
                  Math.random() * 6 * intensity - 3 * intensity
                }px) translateY(${Math.random() * 2 - 1}px)`,
                clipPath: `polygon(0 0, 100% 0, 100% ${
                  30 + Math.random() * 40
                }%, 0 ${30 + Math.random() * 40}%)`,
              }}
            >
              {children}
            </span>

            <span
              className="absolute top-0 left-0 text-cyan-400"
              style={{
                opacity: 0.6 * intensity,
                transform: `translateX(${
                  Math.random() * 6 * intensity - 3 * intensity
                }px) translateY(${Math.random() * 2 - 1}px)`,
                clipPath: `polygon(0 ${60 + Math.random() * 20}%, 100% ${
                  60 + Math.random() * 20
                }%, 100% 100%, 0 100%)`,
              }}
            >
              {children}
            </span>

            <span
              className="absolute top-0 left-0 text-green-400"
              style={{
                opacity: 0.4 * intensity,
                transform: `translateX(${
                  Math.random() * 4 * intensity - 2 * intensity
                }px) scaleY(${0.98 + Math.random() * 0.04})`,
                clipPath: `polygon(0 ${40 + Math.random() * 20}%, 100% ${
                  40 + Math.random() * 20
                }%, 100% ${60 + Math.random() * 20}%, 0 ${
                  60 + Math.random() * 20
                }%)`,
              }}
            >
              {children}
            </span>

            {/* Static noise blocks */}
            {Array.from({ length: Math.floor(3 * intensity) }).map((_, i) => (
              <div
                key={i}
                className="absolute bg-white"
                style={{
                  opacity: 0.2 * intensity,
                  left: `${Math.random() * 80}%`,
                  top: `${Math.random() * 80}%`,
                  width: `${Math.random() * 20 + 5}%`,
                  height: `${Math.random() * 30 + 10}%`,
                  animation: `static-${i % 3} 0.1s linear infinite`,
                }}
              />
            ))}
          </>
        )}
      </span>
    </>
  );
};

export default Glitch;
