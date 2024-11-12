import Link from "next/link";
import { useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

interface FAQItemProps {
  question: string;
  children: React.ReactNode;
  isOpen: boolean;
  onClick: () => void;
}

function FAQItem({ question, children, isOpen, onClick }: FAQItemProps) {
  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        className="w-full py-6 flex justify-between items-center text-left hover:bg-gray-50 transition-colors duration-150 rounded-lg"
        onClick={onClick}
      >
        <h3 className="text-lg font-semibold pr-8 text-gray-800">{question}</h3>
        <ChevronDownIcon
          className={`w-5 h-5 text-gray-500 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[500px] opacity-100 mb-6" : "max-h-0 opacity-0"
        }`}
      >
        <div className="text-gray-600 space-y-3 leading-relaxed pr-8">
          {children}
        </div>
      </div>
    </div>
  );
}

const providerSpecificFAQs = {
  openai: {
    metrics: (
      <p>
        As an LLM observability platform,{" "}
        <span style={{ color: "#0ea5e9" }}>Helicone</span> collects and
        processes billions of ChatGPT and OpenAI API interactions. Our metrics
        cover all OpenAI models including GPT-4 Turbo, GPT-4, GPT-3.5 Turbo,
        DALL-E 3, and more. The statistics you see are calculated from millions
        of real, anonymized production requests, making them highly accurate for
        monitoring OpenAI&apos;s service status and performance.
      </p>
    ),
    reliability: (
      <p>
        Unlike traditional status pages, our ChatGPT and OpenAI status metrics
        are derived from actual production traffic. We analyze millions of
        GPT-4, GPT-3.5, and DALL-E requests in real-time to calculate error
        rates, latency distributions, and availability metrics, providing a more
        accurate picture of OpenAI&apos;s system status and performance.
      </p>
    ),
  },
  anthropic: {
    metrics: (
      <p>
        As an LLM observability platform,{" "}
        <span style={{ color: "#0ea5e9" }}>Helicone</span> collects and
        processes billions of Claude API interactions. Our metrics cover all
        Anthropic models including Claude 3.5 Sonnet, Claude 3 Opus, Claude 2.1,
        and Claude Instant. The statistics you see are calculated from millions
        of real, anonymized production requests, making them highly accurate for
        monitoring Claude&apos;s service status and performance.
      </p>
    ),
    reliability: (
      <p>
        Unlike traditional status pages, our Claude and Anthropic status metrics
        are derived from actual production traffic. We analyze millions of
        Claude API requests in real-time to calculate error rates, latency
        distributions, and availability metrics, providing a more accurate
        picture of Anthropic&apos;s system status and performance.
      </p>
    ),
  },
  default: {
    metrics: (
      <p>
        As an LLM observability platform,{" "}
        <span style={{ color: "#0ea5e9" }}>Helicone</span> collects and
        processes billions of LLM interactions from tens of thousands of users.
        The metrics you see are calculated from millions of real, anonymized
        production requests, making them highly accurate and representative of
        real-world performance.
      </p>
    ),
    reliability: (
      <p>
        Unlike traditional status pages that rely on periodic health checks, our
        metrics are derived from actual production traffic. We analyze millions
        of requests in real-time to calculate error rates, latency
        distributions, and availability metrics, providing a more accurate
        picture of LLM provider performance.
      </p>
    ),
  },
};

export function StatusFAQ({ provider = "default" }: { provider?: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqContent =
    providerSpecificFAQs[
      provider.toLowerCase() as keyof typeof providerSpecificFAQs
    ] || providerSpecificFAQs.default;

  const faqs = [
    {
      question: "How are these metrics calculated?",
      content: faqContent.metrics,
    },
    {
      question: "What makes these status checks reliable?",
      content: faqContent.reliability,
    },
    {
      question: "What should I do if a provider goes down?",
      content: (
        <p>
          <span style={{ color: "#0ea5e9" }}>Helicone</span> offers a{" "}
          <Link
            href="https://docs.helicone.ai/getting-started/integration-method/gateway-fallbacks"
            className="text-blue-600 hover:underline"
          >
            Gateway Fallbacks
          </Link>{" "}
          feature—one of our many tools to enhance your LLM applications—which
          automatically routes requests to backup providers during outages. This
          ensures your application stays running with zero disruption to your
          users.
        </p>
      ),
    },
    {
      question: "How can Helicone help improve my LLM application?",
      content: (
        <>
          <p>
            Beyond status monitoring, Helicone provides comprehensive tools for:
          </p>
          <ul className="list-disc ml-6 mt-2">
            <li>Real-time monitoring of your LLM requests and responses</li>
            <li>Advanced request tracing and debugging capabilities</li>
            <li>Comprehensive cost, usage, and performance analytics</li>
            <li>Automated prompt evaluation using LLM-as-a-judge</li>
            <li>Interactive prompt engineering and testing suite</li>
            <li>Deep insights into user behavior and usage patterns</li>
          </ul>
          <p className="mt-2">
            These features help you build more reliable, cost-effective, and
            performant LLM applications. Check us out at{" "}
            <Link
              href="https://helicone.ai"
              className="text-blue-600 hover:underline"
            >
              helicone.ai
            </Link>
          </p>
        </>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mt-8">
      <h2 className="text-2xl font-bold mb-8 text-gray-900">
        Frequently Asked Questions
      </h2>
      <div className="divide-y divide-gray-200">
        {faqs.map((faq, index) => (
          <FAQItem
            key={index}
            question={faq.question}
            isOpen={openIndex === index}
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          >
            {faq.content}
          </FAQItem>
        ))}
      </div>
    </div>
  );
}
