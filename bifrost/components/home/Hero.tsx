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
    <section className={cn("relative pt-12 pb-6 lg:pt-20", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-12">
          <div className="flex flex-col gap-10 items-center">
            <div className="space-y-6">
              <h1 className="text-center space-y-4">
                <span className="block text-4xl md:text-5xl font-normal tracking-normal text-slate-800">
                  LLM
                </span>
                <span className="block text-5xl md:text-6xl font-bold tracking-tight text-brand">
                  Observability
                </span>
                <span className="block text-4xl md:text-5xl font-normal tracking-normal text-slate-800">
                  at Scale
                </span>
              </h1>

              <p className="text-xl text-slate-700 max-w-2xl mx-auto leading-relaxed">
                Get instant visibility into your AI interactions
              </p>
            </div>

            <div className="flex flex-col gap-5 items-center">
              <Link href="https://us.helicone.ai/signup">
                <Button
                  variant="landing_primary"
                  size="landing_page"
                  className="bg-brand hover:bg-brand/90 text-white font-medium tracking-wide rounded px-8 py-4 text-lg shadow-sm"
                  onMouseEnter={() => setIsLampOn(true)}
                  onMouseLeave={() => setIsLampOn(false)}
                >
                  Start Debugging
                  <ChevronRight className="size-5 ml-1" />
                </Button>
              </Link>

              <Small className="text-slate-500 font-normal">
                Start with one line of code
              </Small>
            </div>
          </div>
        </div>

        {/* Terminal section - keep or update as needed */}
        {/* ... existing terminal code ... */}
      </div>
    </section>
  );
};

export default Hero;
