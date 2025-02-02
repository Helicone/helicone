import { providers } from "@/packages/cost/providers/mappings";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@radix-ui/react-accordion";
import { ChevronRight, Info, HelpCircle } from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect } from "react";

// Function to format provider names
export function formatProviderName(provider: string): string {
  const formattingMap: { [key: string]: string } = {
    OPENAI: "OpenAI",
    ANTHROPIC: "Anthropic",
    AZURE: "Azure",
    TOGETHER: "Together AI",
    FIREWORKS: "Fireworks",
    OPENROUTER: "OpenRouter",
    GROQ: "Groq",
    QSTASH: "Qstash",
    MISTRAL: "Mistral",
    GOOGLE: "Google",
    COHERE: "Cohere",
  };

  return formattingMap[provider.toUpperCase()] || provider.toUpperCase();
}

const getParentModelInfo = (provider: string, model: string) => {
  const providerData = providers.find(
    (p) => p.provider.toLowerCase() === provider.toLowerCase()
  );
  if (!providerData?.modelDetails) return null;

  for (const [parentModel, details] of Object.entries(
    providerData.modelDetails
  )) {
    if (details.matches.includes(model)) {
      return {
        name: details.searchTerms[0],
        matches: details.matches,
      };
    }
  }
  return null;
};

// Reusable FAQ component
const LLMPricingFAQ = () => {
  const [faq1Open, setFaq1Open] = React.useState(false);
  const [faq2Open, setFaq2Open] = React.useState(false);
  const [faq3Open, setFaq3Open] = React.useState(false);
  const [faq4Open, setFaq4Open] = React.useState(false);
  const [faq5Open, setFaq5Open] = React.useState(false);

  return (
    <section>
      <h3 className="text-2xl font-semibold mb-8 mt-12">
        Frequently asked questions
      </h3>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="faq-1" className="mb-4 mt-4">
          <AccordionTrigger
            className="font-medium text-slate-700 mb-2 flex items-start justify-between w-full text-left"
            onClick={() => setFaq1Open(!faq1Open)}
          >
            How does LLM API pricing work?
            <svg
              className={`w-5 h-5 text-slate-500 ml-auto ${
                faq1Open ? "transform rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="m6 9 6 6 6-6"
              ></path>
            </svg>
          </AccordionTrigger>
          <AccordionContent className="text-slate-500 text-sm mb-6">
            LLM API pricing typically works on a pay-per-use model, where
            you&apos;re charged based on the number of tokens processed. Tokens
            are pieces of text, with prices varying for input (prompts) and
            output (completions). Prices can differ significantly between
            providers and models. To optimize costs, consider using
            Helicone&apos;s caching feature, which can significantly reduce API
            calls and save money. Learn more about caching at{" "}
            <a
              href="https://docs.helicone.ai/features/advanced-usage/caching"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 hover:text-sky-800 underline"
            >
              Helicone Caching
            </a>
            .
          </AccordionContent>
        </AccordionItem>
        <div className="border-t border-slate-200"></div>
        <AccordionItem value="faq-2" className="mb-4 mt-4">
          <AccordionTrigger
            className="font-medium text-slate-700 mb-2 flex items-start justify-between w-full text-left"
            onClick={() => setFaq2Open(!faq2Open)}
          >
            What are the most cost-effective LLM APIs for startups?
            <svg
              className={`w-5 h-5 text-slate-500 ml-auto ${
                faq2Open ? "transform rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="m6 9 6 6 6-6"
              ></path>
            </svg>
          </AccordionTrigger>
          <AccordionContent className="text-slate-500 text-sm mb-6">
            The most cost-effective LLM API depends on your specific use case
            and volume. Generally, open-source and smaller parameter models like
            Llama 3 or Mistral can be more affordable for startups compared to
            larger providers like OpenAI and Anthropic. Our calculator allows
            you to compare prices across providers. Additionally, Helicone
            offers tools to monitor costs and optimize usage, helping startups
            make informed decisions and control expenses.
          </AccordionContent>
        </AccordionItem>
        <div className="border-t border-slate-200"></div>
        <AccordionItem value="faq-3" className="mb-4 mt-4">
          <AccordionTrigger
            className="font-medium text-slate-700 mb-2 flex items-start justify-between w-full text-left"
            onClick={() => setFaq3Open(!faq3Open)}
          >
            How can I reduce my LLM API costs?
            <svg
              className={`w-5 h-5 text-slate-500 ml-auto ${
                faq3Open ? "transform rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="m6 9 6 6 6-6"
              ></path>
            </svg>
          </AccordionTrigger>
          <AccordionContent className="text-slate-500 text-sm mb-6">
            To reduce LLM API costs:
            <ol className="list-decimal pl-5 mt-2 space-y-2">
              <li>
                Use Helicone&apos;s{" "}
                <a
                  href="https://docs.helicone.ai/features/advanced-usage/caching"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-600 hover:text-sky-800 underline"
                >
                  caching feature
                </a>{" "}
                to avoid redundant API calls
              </li>
              <li>
                Optimize your prompts using Helicone&apos;s{" "}
                <a
                  href="https://docs.helicone.ai/features/prompts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-600 hover:text-sky-800 underline"
                >
                  prompt tracking and experiments feature
                </a>{" "}
                to achieve the same results with fewer tokens
              </li>
              <li>
                Consider fine-tuning an open-source model using datasets curated
                within Helicone, potentially in collaboration with{" "}
                <a
                  href="https://openpipe.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-600 hover:text-sky-800 underline"
                >
                  OpenPipe
                </a>
                .
              </li>
              <li>
                Implement efficient{" "}
                <a
                  href="https://helicone.ai/experiments"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-600 hover:text-sky-800 underline"
                >
                  prompt engineering techniques
                </a>
              </li>
              <li>
                Use Helicone&apos;s{" "}
                <a
                  href="https://docs.helicone.ai/references/how-we-calculate-cost"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-600 hover:text-sky-800 underline"
                >
                  cost monitoring tools
                </a>{" "}
                to identify areas for optimization
              </li>
            </ol>
          </AccordionContent>
        </AccordionItem>
        <div className="border-t border-slate-200"></div>
        <AccordionItem value="faq-4" className="mb-4 mt-4">
          <AccordionTrigger
            className="font-medium text-slate-700 mb-2 flex items-start justify-between w-full text-left"
            onClick={() => setFaq4Open(!faq4Open)}
          >
            What&apos;s the difference between input and output tokens in LLM
            API pricing?
            <svg
              className={`w-5 h-5 text-slate-500 ml-auto ${
                faq4Open ? "transform rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="m6 9 6 6 6-6"
              ></path>
            </svg>
          </AccordionTrigger>
          <AccordionContent className="text-slate-500 text-sm mb-6">
            Input tokens refer to the text you send to the API (your prompt),
            while output tokens are the text generated by the model. Many
            providers charge different rates for input and output tokens, with
            output tokens often being more expensive. Our calculator takes both
            into account to give you accurate cost estimates.{" "}
            <a
              href="https://docs.helicone.ai/features/prompts"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 hover:text-sky-800 underline"
            >
              Helicone&apos;s prompt management tools
            </a>{" "}
            can help you optimize both input and output tokens for
            cost-efficiency.
          </AccordionContent>
        </AccordionItem>
        <div className="border-t border-slate-200"></div>
        <AccordionItem value="faq-5" className="mb-4 mt-4">
          <AccordionTrigger
            className="font-medium text-slate-700 mb-2 flex items-start justify-between w-full text-left"
            onClick={() => setFaq5Open(!faq5Open)}
          >
            How accurate is this LLM API pricing calculator?
            <svg
              className={`w-5 h-5 text-slate-500 ml-auto ${
                faq5Open ? "transform rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="m6 9 6 6 6-6"
              ></path>
            </svg>
          </AccordionTrigger>
          <AccordionContent className="text-slate-500 text-sm mb-6">
            Our LLM API pricing calculator is highly accurate and regularly
            updated with the latest pricing information from various providers.
            The same collection of LLM API pricing data is used within the
            Helicone platform, which supports thousands of companies in tracking
            their spending for projects to ensure profitability. This
            requirement for accuracy in a production environment ensures that
            our calculator provides reliable estimates. For enterprise-level
            estimates or custom pricing agreements, it&apos;s best to contact
            providers directly.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
};

// Reusable Contributing section
const ContributingSection = () => (
  <section className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mt-8">
    <h3 className="text-2xl font-semibold mb-6 text-slate-700">
      Contribute to the open-source LLM API pricing database
    </h3>
    <p className="text-slate-500 mb-4">
      As an open-source project, we welcome contributions from the community to
      keep the pricing data accurate and up-to-date.
    </p>
    <div className="bg-sky-50 p-4 rounded-md mb-4">
      <h4 className="font-semibold mb-2 text-sky-700">How to contribute:</h4>
      <ol className="list-decimal pl-5 text-sky-700 mb-2">
        <li>
          Visit our GitHub repository:{" "}
          <a
            href="https://github.com/Helicone/helicone/tree/main/costs"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Helicone Costs
          </a>
        </li>
        <li>
          Follow the instructions in the{" "}
          <a
            href="https://github.com/Helicone/helicone/blob/main/costs/README.md"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            README.md
          </a>{" "}
          file to add or update cost data
        </li>
        <li>Submit a Pull Request with your changes</li>
      </ol>
    </div>
    <p className="text-slate-500">
      By contributing, you&apos;re helping to maintain the largest fully
      open-source collection of LLM API pricing data, covering over 300+ models
      and growing.
    </p>
    <div className="mt-4">
      <a
        href="https://github.com/Helicone/helicone/tree/main/costs"
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-500 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
        target="_blank"
        rel="noopener noreferrer"
      >
        Contribute on GitHub
      </a>
    </div>
  </section>
);

type CalculatorInfoProps = {
  model?: string;
  provider?: string;
};

const CalculatorInfo: React.FC<CalculatorInfoProps> = ({ model, provider }) => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setDarkMode(darkModeMediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setDarkMode(e.matches);
    };

    darkModeMediaQuery.addEventListener("change", handleChange);

    return () => {
      darkModeMediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return (
    <div className={`mt-12 space-y-8 max-w-3xl mx-auto ${darkMode ? "dark" : ""}`}>
      {model && provider ? (
        <>
          {(() => {
            const parentInfo = getParentModelInfo(provider, model);
            return (
              parentInfo &&
              parentInfo.name !== model && (
                <div className="mx-auto w-full">
                  <Link
                    href={`/llm-cost/provider/${encodeURIComponent(
                      provider.toLowerCase()
                    )}/model/${encodeURIComponent(parentInfo.name)}`}
                    className="inline-flex items-center gap-2 text-sm text-sky-600 hover:text-sky-700"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>View {parentInfo.name} model family pricing</span>
                  </Link>
                </div>
              )
            );
          })()}
          <section className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-2xl font-semibold mb-4 text-slate-700">
              What is the {formatProviderName(provider)} {model} API Pricing
              Calculator?
            </h3>
            <p className="text-slate-500 mb-4">
              Our {formatProviderName(provider)} {model} API Pricing Calculator
              is a powerful tool designed to help you:
            </p>
            <ul className="list-disc pl-6 mb-4 text-slate-500">
              <li>Accurately estimate costs for your API usage</li>
              <li>Plan your budget more effectively</li>
              <li>Compare pricing across different models and providers</li>
            </ul>
            <p className="text-slate-500 mb-4">
              Using the latest pricing data directly from{" "}
              {formatProviderName(provider)}, this calculator provides you with
              precise cost estimates for the {model} API.
            </p>
            <div className="bg-sky-50 p-4 rounded-md">
              <p className="text-sky-700 font-medium">
                Built and maintained by the Helicone team, this calculator is
                part of the largest fully open-source collection of LLM API
                pricing data, covering over 300+ models and growing.
              </p>
            </div>
          </section>

          <section className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mt-8">
            <h3 className="text-2xl font-semibold mb-4 text-slate-700">
              Top benefits of the {formatProviderName(provider)} {model} pricing
              Calculator
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center">
                <div className="bg-sky-100 p-3 rounded-full mb-3">
                  <svg
                    className="w-6 h-6 text-sky-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                </div>
                <p className="text-sky-700 font-medium">
                  Accurate real-time pricing data
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="bg-green-100 p-3 rounded-full mb-3">
                  <svg
                    className="w-6 h-6 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                </div>
                <p className="text-green-700 font-medium">
                  Quickly compare costs across different models and providers
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="bg-purple-100 p-3 rounded-full mb-3">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                </div>
                <p className="text-purple-700 font-medium">
                  Built and maintained by the Helicone team
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mt-8">
            <h3 className="text-2xl font-semibold mb-4 text-slate-700">
              Tips to Use the {formatProviderName(provider)} {model} Pricing
              Calculator
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <svg
                  className="w-6 h-6 text-green-500 mr-2 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h4 className="font-semibold">
                    Understand Input and Output Tokens
                  </h4>
                  <p className="text-slate-500">
                    Input tokens represent the text you send to the API, while
                    output tokens are the generated response. Adjust these
                    values to match your expected usage.
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-6 h-6 text-green-500 mr-2 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h4 className="font-semibold">Compare Different Scenarios</h4>
                  <p className="text-slate-500">
                    Try various input and output token combinations to estimate
                    costs for different use cases or conversation lengths.
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-6 h-6 text-green-500 mr-2 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h4 className="font-semibold">Consider Your Usage Volume</h4>
                  <p className="text-slate-500">
                    Remember that the calculator shows per-request costs.
                    Multiply the result by your expected number of API calls to
                    estimate total costs.
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-6 h-6 text-green-500 mr-2 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h4 className="font-semibold">Explore Other Models</h4>
                  <p className="text-slate-500">
                    Use the &quot;All Models&quot; table to compare costs across
                    different {formatProviderName(provider)} models or even
                    other providers.
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-6 h-6 text-green-500 mr-2 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h4 className="font-semibold">Stay Updated</h4>
                  <p className="text-slate-500">
                    Check back regularly as pricing may change. Our calculator
                    is updated with the latest {formatProviderName(provider)}{" "}
                    pricing information.
                  </p>
                </div>
              </li>
            </ul>
          </section>

          {/* Use the reusable Contributing section */}
          <ContributingSection />

          {/* Use the reusable FAQ component */}
          <LLMPricingFAQ />
        </>
      ) : (
        <>
          <section className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-2xl font-semibold mb-6 text-slate-700">
              What is the LLM API Pricing Calculator?
            </h3>
            <p className="text-slate-500 mb-4">
              Our LLM API Pricing Calculator is a powerful tool designed to help
              you:
            </p>
            <ul className="list-disc pl-6 mb-4 text-slate-500">
              <li>
                Accurately estimate costs for your API usage across various
                providers and models
              </li>
              <li>Plan your budget more effectively</li>
              <li>Compare pricing across different models and providers</li>
            </ul>
            <p className="text-slate-500 mb-4">
              Using the latest pricing data directly from various AI providers,
              this calculator provides you with precise cost estimates for a
              wide range of LLM APIs.
            </p>
            <div className="bg-sky-50 p-4 rounded-md">
              <p className="text-sky-700 font-medium">
                Built and maintained by the Helicone team. This calculator is
                part of the largest fully open-source collection of LLM API
                pricing data, covering over 300+ models and growing.
              </p>
            </div>
          </section>

          <section className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mt-8">
            <h3 className="text-2xl font-semibold mb-6 text-slate-700">
              Top benefits of the LLM API Pricing Calculator
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center">
                <div className="bg-sky-100 p-3 rounded-full mb-3">
                  <svg
                    className="w-6 h-6 text-sky-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                </div>
                <p className="text-sky-700 font-medium">
                  Comprehensive model coverage
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="bg-green-100 p-3 rounded-full mb-3">
                  <svg
                    className="w-6 h-6 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                </div>
                <p className="text-green-700 font-medium">
                  Easy comparison across providers
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="bg-purple-100 p-3 rounded-full mb-3">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                </div>
                <p className="text-purple-700 font-medium">
                  Up-to-date pricing information
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mt-8">
            <h3 className="text-2xl font-semibold mb-6 text-slate-700">
              Tips on using the LLM API Pricing Calculator
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <svg
                  className="w-6 h-6 text-green-500 mr-2 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h4 className="font-medium text-slate-700">
                    Compare multiple models
                  </h4>
                  <p className="text-slate-500 mb-2">
                    Use the calculator to compare costs across different models
                    and providers to find the best fit for your needs.
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-6 h-6 text-green-500 mr-2 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h4 className="font-medium text-slate-700">
                    Adjust token counts
                  </h4>
                  <p className="text-slate-500 mb-2">
                    Experiment with different input and output token counts to
                    estimate costs for various use cases.
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-6 h-6 text-green-500 mr-2 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h4 className="font-medium text-slate-700">
                    Consider your usage volume
                  </h4>
                  <p className="text-slate-500 mb-2">
                    Remember to factor in your expected usage volume when
                    comparing costs across different providers.
                  </p>
                </div>
              </li>
            </ul>
          </section>

          <ContributingSection />

          <LLMPricingFAQ />
        </>
      )}
    </div>
  );
};

export default CalculatorInfo;
