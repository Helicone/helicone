"use client";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { useState, ReactNode } from "react";

export default function Faqs() {
  const [open, setOpen] = useState(-1);

  return (
    <div className="flex flex-col pb-2 w-full md:items-center items-start text-start md:pl-0 w-full">
      <h2 className="text-[32px] md:text-4xl font-bold md:self-center text-start">
        Frequently Asked <br /> Questions
      </h2>

      <div className="flex flex-col md:mt-16 mt-8 items-center gap-4 w-full">
        {FAQS.map((faq, index) => (
          <div
            onClick={() => setOpen((prev) => (prev === index ? -1 : index))}
            key={index}
            className="w-full p-4 border-2 border-sky-100 rounded-xl cursor-pointer"
          >
            <h3 className="text-lg font-bold flex justify-start items-center">
              <ChevronRightIcon
                className={`mx-[24px] w-10 h-10 ${
                  open === index ? "rotate-90" : ""
                }`}
              />
              <span className="text-gray-500">{faq.question}</span>
            </h3>
            <div
              className={`text-gray-500 ${
                open === index ? "block mt-2 pl-6" : "hidden"
              }`}
            >
              {faq.answer}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface FAQItem {
  question: string;
  answer: ReactNode;
}

const FAQS: FAQItem[] = [
  {
    question: "Is there an impact to the latency of the calls to LLM?",
    answer: (
      <>
        Helicone proxies your requests through globally distributed nodes
        running on Cloudflare Workers. This means that the latency is minimal
        and the requests are routed to the closest server to the end user.{" "}
        <a
          href="https://docs.helicone.ai/references/latency-affect"
          className="text-blue-500 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Read more about Helicone&apos;s latency impact
        </a>
        .
      </>
    ),
  },
  {
    question:
      "I don&apos;t want to use Helicone&apos;s Proxy, can I still use Helicone?",
    answer: (
      <>
        Yes, you can still use Helicone to log your requests using the{" "}
        <a
          href="https://docs.helicone.ai/references/proxy-vs-async#async"
          className="text-blue-500 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Helicone SDK&apos;s Async Integration
        </a>{" "}
        without proxying. However, it&apos;s worth noting that thousands of
        companies use our proxy in production with high reliability. We leverage
        Cloudflare&apos;s global network to ensure minimal latency and maximum
        uptime. If you have concerns about using our proxy in your critical
        path, we have a{" "}
        <a
          href="https://docs.helicone.ai/references/availability"
          className="text-blue-500 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          detailed documentation on our availability and reliability
        </a>{" "}
        that addresses common concerns and explains our robust infrastructure.
      </>
    ),
  },
  {
    question: "How do you calculate the cost of LLM requests?",
    answer: (
      <>
        We use the <code>usage</code> tag returned by OpenAI, Anthropic, and
        other providers to calculate the cost of LLM requests. For more details,
        see{" "}
        <a
          href="https://docs.helicone.ai/references/how-we-calculate-cost"
          className="text-blue-500 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          How we calculate costs.
        </a>
        <br />
        <br />
        To calculate your expected costs across models and providers, you can
        use our free, open-source tool with 300+ models:{" "}
        <a
          href="https://www.helicone.ai/llm-cost"
          className="text-blue-500 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          LLM API Pricing Calculator
        </a>
        .
      </>
    ),
  },
];
