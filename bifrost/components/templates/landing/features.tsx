export default function Features() {
  return (
    <div className="flex w-full flex-col items-start space-y-4 pb-2 pl-5 text-start md:items-center md:pl-0">
      <h2 className="text-start text-3xl font-bold leading-tight tracking-tight text-black md:text-4xl">
        No packages, <span className="text-sky-500">just headers</span>
      </h2>
      <p className="md:text-md max-w-4xl text-start text-sm text-gray-500 md:text-center">
        Access every Helicone feature by just adding headers, no SDKs required.
      </p>

      <div className="md:gap-x-18 grid w-full grid-cols-2 gap-8 pr-16 md:grid-cols-4 md:gap-y-10 md:pt-16">
        {FEATURES.map((feature) => (
          <a
            key={feature.title}
            href={feature.href}
            target="_blank"
            className="flex flex-col items-start rounded-md p-2 md:p-4 md:hover:bg-sky-100"
          >
            <div>
              <h3 className="text-md font-bold text-sky-500 md:text-lg">
                {feature.title}
              </h3>
              <p className="md:text-md max-w-[24ch] text-sm text-gray-400">
                {feature.description}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

const FEATURES = [
  {
    title: "Prompts",
    description: "Monitor prompt versioning.",
    href: "https://docs.helicone.ai/features/prompts#prompts-and-experiments",
  },
  {
    title: "Custom Properties",
    description: "Label and segment your requests.",
    href: "https://docs.helicone.ai/features/advanced-usage/custom-properties#custom-properties",
  },
  {
    title: "Caching",
    description: "Save costs by caching your requests.",
    href: "https://docs.helicone.ai/features/advanced-usage/caching#llm-caching",
  },
  {
    title: "Omitting Logs",
    description: "Remove certain requests from your logs.",
    href: "https://docs.helicone.ai/features/advanced-usage/omit-logs#omit-logs",
  },
  {
    title: "User Metrics",
    description: "Get insights into your users' usage.",
    href: "https://docs.helicone.ai/features/advanced-usage/user-metrics#user-metrics",
  },
  {
    title: "Feedback",
    description: "Collect feedback from your users on LLM responses.",
    href: "https://docs.helicone.ai/features/advanced-usage/feedback#user-feedback",
  },
  {
    title: "Scores",
    description: "Scores your requests and experiments",
    href: "https://docs.helicone.ai/features/advanced-usage/scores#scores",
  },
  {
    title: "Gateway Fallback",
    description: "Use any provider as a fallback via Helicone Gateway.",
    href: "https://docs.helicone.ai/getting-started/integration-method/gateway-fallbacks#gateway-fallbacks-for-llm-providers",
  },
  {
    title: "Retries",
    description: "Auto retries on failed requests.",
    href: "https://docs.helicone.ai/features/advanced-usage/retries#retries",
  },
  {
    title: "Rate Limiting",
    description: "Easily rate limit your users.",
    href: "https://docs.helicone.ai/features/advanced-usage/custom-rate-limits",
  },
  {
    title: "Key Vaults",
    description: "Manage and distribute your API keys securely.",
    href: "https://docs.helicone.ai/features/advanced-usage/vault#key-vault",
  },
  {
    title: "Prompt Security",
    description: "Moderate your users' calls for safety and prompt injection.",
    href: "https://docs.helicone.ai/features/advanced-usage/llm-security",
  },
];
