"use client";

import { ISLAND_WIDTH } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  Send,
  Sparkles,
  Activity,
  DollarSign,
  Zap,
} from "lucide-react";
import LogoBox from "./LogoBox";
import Link from "next/link";
import Image from "next/image";
import { Button } from "../ui/button";
import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  sender: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface ModelOption {
  id: string;
  name: string;
  provider: string;
  cost: string;
  color: string;
  logo: string;
}

interface Feature {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const Hero = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedFeature, setSelectedFeature] = useState<string>("");
  const [selectedPrompt, setSelectedPrompt] = useState<string>("");
  const chatRef = useRef<HTMLDivElement>(null);

  const models: ModelOption[] = [
    {
      id: "gpt-4",
      name: "GPT-4",
      provider: "OpenAI",
      cost: "$0.03/1K",
      color: "bg-green-500",
      logo: "/static/home/logos/openai.webp",
    },
    {
      id: "claude-3",
      name: "Claude 3.5",
      provider: "Anthropic",
      cost: "$0.015/1K",
      color: "bg-orange-500",
      logo: "/static/home/anthropic.webp",
    },
    {
      id: "gemini",
      name: "Gemini 2.0",
      provider: "Google",
      cost: "$0.002/1K",
      color: "bg-blue-500",
      logo: "/static/home/gemini.webp",
    },
  ];

  const features: Feature[] = [
    {
      id: "monitoring",
      name: "Real-time Monitoring",
      description: "Track latency, costs, and performance",
      icon: <Activity className="w-4 h-4" />,
      color: "blue",
    },
    {
      id: "routing",
      name: "Smart Routing",
      description: "Route to the best model automatically",
      icon: <Zap className="w-4 h-4" />,
      color: "green",
    },
    {
      id: "optimization",
      name: "Cost Optimization",
      description: "Reduce AI costs by up to 45%",
      icon: <DollarSign className="w-4 h-4" />,
      color: "purple",
    },
  ];

  const suggestedPrompts = [
    "Explain quantum computing in simple terms",
    // "Write a haiku about programming",
    // "Plan a weekend trip to San Francisco",
  ];

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = () => {
    if (!selectedModel || !selectedFeature || !selectedPrompt) return;

    // Just log the selections for now - no response or navigation
    console.log("Submitted:", {
      model: selectedModel,
      feature: selectedFeature,
      prompt: selectedPrompt,
    });

    // You can add any analytics tracking or other side effects here
    // For now, the flow stops here as requested
  };

  const isSubmitEnabled = selectedModel && selectedFeature && selectedPrompt;

  return (
    <div
      className={cn(
        "flex flex-col justify-top h-auto relative lg:w-[1300px] 2xl:w-[1500px]",
        ISLAND_WIDTH
      )}
    >
      <div className="flex flex-wrap gap-x-12 gap-y-4 items-center mt-12 lg:mt-0 mb-12">
        <div className="flex items-center gap-2 text-sm font-medium whitespace-nowrap">
          <p>Backed by</p>
          <Image
            src="/static/home/yc-logo.webp"
            alt="Y Combinator"
            className="w-24 h-auto"
            width={96}
            height={24}
            priority
          />
        </div>
        <Image
          src="/static/home/productoftheday.webp"
          alt="Product of the Day"
          className="w-32 h-auto"
          width={128}
          height={32}
          priority
        />
      </div>

      <h1 className="text-xl sm:text-7xl md:text-[84px] font-semibold mb-3 w-full max-w-4xl text-wrap text-black z-[10]">
        Build Reliable
        <br />
        <span className="text-brand">AI Apps</span>
      </h1>

      <p className="text-lg sm:text-xl 2xl:text-2xl text-landing-secondary font-light mb-6 z-[10]">
        The world&apos;s fastest-growing AI companies rely on Helicone
        <br />
        to route, debug, and analyze their applications.
      </p>

      {/* Simple Prompt Dropdown */}
      {/* <div className="flex items-center gap-4 mb-8 z-[10]">
        <select
          value={selectedPrompt}
          onChange={(e) => setSelectedPrompt(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
        >
          <option value="">Select a prompt...</option>
          {suggestedPrompts.map((prompt) => (
            <option key={prompt} value={prompt}>
              {prompt}
            </option>
          ))}
        </select>
        <Button
          onClick={handleSubmit}
          // disabled={!selectedPrompt}
          className={"px-6 py-3 rounded-lg text-base font-medium transition-all bg-brand hover:bg-brand/90 text-white shadow-lg gap-2"}
          //   selectedPrompt
          //     ? "bg-brand hover:bg-brand/90 text-white shadow-lg"
          //     : "bg-gray-200 text-gray-400 cursor-not-allowed"
          // )}
        >
          {/* <Send className="w-4 h-4 mr-2" /> */}
      {/* Try for free <ChevronRight className="w-4 h-4" />
        </Button>
      </div> */}

      {/* Interactive Demo */}
      {/* <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 mb-8 shadow-lg max-w-4xl w-full z-[10]"> */}
      {/* Step 1: Select Model */}
      {/* <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            1. Choose your AI model
          </h3>
          <div className="flex space-x-2 flex-wrap gap-2">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={cn(
                  "flex items-center space-x-2 p-3 rounded-lg border transition-all hover:shadow-md",
                  selectedModel === model.id
                    ? "bg-blue-50 border-blue-200 shadow-sm ring-2 ring-blue-500"
                    : "bg-white hover:bg-gray-50"
                )}
              >
                <div className={cn("w-3 h-3 rounded-full", model.color)} />
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {model.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {model.cost} tokens
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div> */}

      {/* Step 2: Select Feature */}
      {/* <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            2. What would you like to optimize for?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {features.map((feature) => (
              <button
                key={feature.id}
                onClick={() => setSelectedFeature(feature.id)}
                className={cn(
                  "rounded-lg p-3 flex items-center space-x-2 transition-all hover:shadow-md",
                  selectedFeature === feature.id
                    ? `bg-${feature.color}-100 border-2 border-${feature.color}-300 ring-2 ring-${feature.color}-500`
                    : `bg-${feature.color}-50 border border-${feature.color}-200 hover:bg-${feature.color}-100`
                )}
              >
                <div className={`text-${feature.color}-600`}>
                  {feature.icon}
                </div>
                <div>
                  <div
                    className={`text-sm font-semibold text-${feature.color}-900`}
                  >
                    {feature.name}
                  </div>
                  <div className={`text-xs text-${feature.color}-700`}>
                    {feature.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div> */}

      {/* Step 3: Select Prompt */}
      <div className="mb-6">
        {/* <h3 className="text-sm font-semibold text-gray-900 mb-3">
            3. Try one of these examples
          </h3> */}
        <div className="flex flex-wrap gap-1">
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => setSelectedPrompt(prompt)}
              className={cn(
                "px-3 py-4 rounded-lg text-md border transition-all hover:shadow-sm",
                selectedPrompt === prompt
                  ? "bg-gray-100 text-black border-gray-700 ring-2 ring-[#C0F9F4]/30"
                  : "bg-brand hover:bg-brand/90 text-white border-[#C0F9F4]"
              )}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      {/* <div className="flex justify-center w-full">
          <Button
            onClick={handleSubmit}
            disabled={!isSubmitEnabled}
            className={cn(
              "px-8 py-3 rounded-xl text-base font-medium transition-all",
              isSubmitEnabled
                ? "bg-brand hover:bg-brand/90 text-white shadow-lg"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            <Send className="w-4 h-4 mr-2" />
            Try Helicone Gateway
          </Button>
        </div> */}

      {/* Selection Summary
        {(selectedModel || selectedFeature || selectedPrompt) && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Your selection:</div>
            <div className="text-sm text-gray-800">
              {selectedModel && (
                <span className="font-medium">
                  {models.find((m) => m.id === selectedModel)?.name}
                </span>
              )}
              {selectedModel && selectedFeature && " • "}
              {selectedFeature && (
                <span className="font-medium">
                  {features.find((f) => f.id === selectedFeature)?.name}
                </span>
              )}
              {(selectedModel || selectedFeature) && selectedPrompt && " • "}
              {selectedPrompt && (
                <span className="font-medium">&quot;{selectedPrompt}&quot;</span>
              )}
            </div>
          </div>
        )} */}
      {/* </div> */}

      <div className="flex flex-col md:flex-row gap-4 mb-12">
        <div className="flex flex-col gap-2">
          {/* <Link href="https://us.helicone.ai/signup">
            <Button className="bg-brand px-8 py-4 text-base md:text-lg md:py-3 lg:py-6 lg:px-10 lg:text-xl gap-2 rounded-lg items-center z-[10]">
              Try for free
              <ChevronRight className="size-5 md:size-6" />
            </Button>
          </Link> */}
          <p className="text-sm text-landing-secondary">
            No credit card required, 7-day free trial
          </p>
        </div>
      </div>

      <div className="hidden lg:block" aria-hidden="true">
        {/* Existing logo positioning - adjusted for new layout */}
        <LogoBox
          imgSrc="/static/home/gemini.webp"
          className="w-[96px] h-[96px] absolute top-[180px] right-1/3 translate-x-[-100px] rotate-[-15deg]"
          innerClassName=""
        />
        <LogoBox
          imgSrc="/static/home/logos/deepseek.webp"
          className="w-[120px] h-[120px] absolute top-[260px] right-1/3 translate-x-[80px] rotate-[13deg]"
        />
        <LogoBox
          imgSrc="/static/home/logos/openai.webp"
          className="w-[140px] h-[140px] absolute top-[120px] right-1/4 translate-x-[100px] rotate-[15deg]"
          innerClassName="rounded-3xl"
        />
        <LogoBox
          imgSrc="/static/home/logos/togetherai.webp"
          className="w-[120px] h-[120px] absolute top-[148px] right-0 -translate-x-[40px] rotate-[6deg]"
          innerClassName="rounded-3xl"
        />
        <LogoBox
          imgSrc="/static/home/anthropic.webp"
          className="w-[150px] h-[150px] absolute bottom-[120px] right-1/3 translate-x-[0px] rotate-[13deg]"
          innerClassName="p-4"
        />
        <LogoBox
          imgSrc="/static/home/mistral.webp"
          className="w-[96px] h-[96px] absolute bottom-1/3 translate-y-[60px] right-1/4 translate-x-[100px] -rotate-[15deg]"
          innerClassName="p-2"
        />
        <LogoBox
          imgSrc="/static/home/logos/groq.webp"
          className="w-[120px] h-[120px] absolute top-1/2 translate-y-[50px] right-0 -translate-x-[80px] rotate-[27deg]"
          innerClassName="p-2"
        />
        <LogoBox
          imgSrc="/static/home/logos/openrouter.webp"
          className="w-[112px] h-[112px] absolute bottom-[40px] right-1/4 translate-x-[100px] rotate-[-32deg]"
          innerClassName="p-2"
        />
        <LogoBox
          imgSrc="/static/home/logo4.webp"
          className="w-[80px] h-[80px] absolute bottom-[160px] right-0 -translate-x-[60px] rotate-[-15deg]"
        />
      </div>
    </div>
  );
};

export default Hero;
