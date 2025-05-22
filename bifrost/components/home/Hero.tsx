"use client";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "../ui/button";
import { H1, P, Small } from "@/components/ui/typography";
import { useState, useEffect } from "react";

// Import pixel font - add to <head> in layout component if needed
// import { Press_Start_2P } from 'next/font/google';
// const pixelFont = Press_Start_2P({ weight: '400', subsets: ['latin'] });

const Hero = ({ className }: { className?: string }) => {
  const [cursorVisible, setCursorVisible] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [isLampOn, setIsLampOn] = useState(false);

  const terminalSteps = [
    { text: "// Add Helicone to your OpenAI client", typing: true },
    { text: "import OpenAI from 'openai';", typing: true },
    { text: "", typing: false },
    { text: "const openai = new OpenAI({", typing: true },
    { text: "  apiKey: OPENAI_API_KEY,", typing: true },
    {
      text: "  baseURL: `https://oai.helicone.ai/v1/${HELICONE_API_KEY}/`",
      typing: true,
    },
    { text: "});", typing: true },
    { text: "", typing: false },
    {
      text: "// Now all your requests are logged automatically!",
      typing: true,
    },
    {
      text: "const chatCompletion = await openai.chat.completions.create({",
      typing: true,
    },
    { text: "  model: 'gpt-3.5-turbo',", typing: true },
    {
      text: "  messages: [{ role: 'user', content: 'Hello!' }],",
      typing: true,
    },
    { text: "});", typing: true },
  ];

  // Blinking cursor effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, []);

  // Typing effect
  useEffect(() => {
    if (currentStep >= terminalSteps.length) return;

    const currentStepData = terminalSteps[currentStep];

    if (!currentStepData.typing) {
      // Skip typing animation for non-typing steps
      setTypedText("");
      setCurrentStep((prev) => prev + 1);
      return;
    }

    if (typedText.length < currentStepData.text.length) {
      const timeout = setTimeout(() => {
        setTypedText(currentStepData.text.substring(0, typedText.length + 1));
      }, 30);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        setTypedText("");
        setCurrentStep((prev) => prev + 1);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [currentStep, typedText]);

  return (
    <section
      className={cn(
        "relative py-12 lg:py-16",
        "bg-[size:24px_24px]",
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center mb-12">
          <div className="flex flex-col gap-8">
            <div>
              <h1
                className="font-mono text-5xl md:text-6xl font-bold leading-tight tracking-tight text-black"
                // style={{ textShadow: "2px 2px 0px rgba(12,165,234,0.2)" }}
              >
                <span
                  className="block mb-3 uppercase tracking-wide"
                  style={{ letterSpacing: "0.05em" }}
                >
                  The
                </span>
                <span
                  className="text-[#0ca5ea] uppercase tracking-wide"
                  style={{ letterSpacing: "0.05em" }}
                >
                  Observability
                </span>
                <span
                  className="block mt-3 uppercase tracking-wide"
                  style={{ letterSpacing: "0.05em" }}
                >
                  Engine for LLMs
                </span>
              </h1>

              <p
                className="font-mono text-xl md:text-2xl text-black/80 mt-8 max-w-xl"
                style={{ letterSpacing: "0.02em" }}
              >
                Get instant visibility into your AI interactions
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <Link href="https://us.helicone.ai/signup">
                <Button
                  variant="landing_primary"
                  size="landing_page"
                  className="bg-[#0ca5ea] hover:bg-[#0990d3] text-white font-mono uppercase tracking-wider rounded-sm px-8 py-4 text-lg"
                  onMouseEnter={() => setIsLampOn(true)}
                  onMouseLeave={() => setIsLampOn(false)}
                >
                  Start Debugging
                  <ChevronRight className="size-5" />
                </Button>
              </Link>

              <Small className="text-black/70 text-base font-mono uppercase tracking-wide">
                Start with one line of code
              </Small>
            </div>
          </div>

          <div className="flex justify-center md:justify-end relative">
            {/* Lamp off (default) */}
            <Image
              src="/static/home/lamp.png"
              alt="Lamp illustration"
              width={400}
              height={400}
              className={cn(
                "w-auto h-auto grayscale absolute",
                isLampOn ? "opacity-0" : "opacity-100"
              )}
              style={{ transform: "scaleX(-1)" }}
              priority
            />

            {/* Lamp on (hover) */}
            <Image
              src="/static/home/lamp2.png"
              alt="Lamp illustration (on)"
              width={400}
              height={400}
              className={cn(
                "w-auto h-auto grayscale absolute",
                isLampOn ? "opacity-100" : "opacity-0"
              )}
              style={{ transform: "scaleX(-1)" }}
              priority
            />

            {/* Spacer to maintain layout */}
            <div className="w-[400px] h-[400px]" />
          </div>
        </div>

        {/* Terminal section - keep or update as needed */}
        {/* ... existing terminal code ... */}
      </div>
    </section>
  );
};

export default Hero;
