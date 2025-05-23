"use client";

import Glitch from "./Glitch";
import { useState, useEffect } from "react";

interface GlitchCycleProps {
  words: string[];
  className?: string;
  intensity?: number;
  frequency?: number;
  duration?: number;
}

const GlitchCycle = ({
  words,
  className,
  intensity = 0.7,
  frequency = 3000,
  duration = 600,
}: GlitchCycleProps) => {
  const [currentWord, setCurrentWord] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);

      setTimeout(() => {
        setCurrentWord((prev) => (prev + 1) % words.length);

        setTimeout(() => {
          setIsTransitioning(false);
        }, duration / 2);
      }, duration / 2);
    }, frequency);

    return () => clearInterval(interval);
  }, [words.length, frequency, duration]);

  // Reserve space for the longest word to prevent layout shifts
  const longestWord = words.reduce((a, b) => (a.length > b.length ? a : b), "");

  return (
    <span
      className="relative inline-block"
      style={{ minWidth: `${longestWord.length}ch` }}
    >
      <Glitch
        className={className}
        intensity={intensity}
        frequency={frequency}
        duration={duration}
        disabled={!isTransitioning}
      >
        {words[currentWord]}
      </Glitch>
    </span>
  );
};

export default GlitchCycle;
