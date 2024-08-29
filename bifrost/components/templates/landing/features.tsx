export default function Features() {
  return (
    <div className="flex flex-col space-y-4 pb-2 w-full md:items-center items-start text-start md:pl-0 pl-5">
      <h2 className="text-3xl md:text-4xl font-bold text-black text-start tracking-tight leading-tight">
        No packages, <span className="text-sky-500">just headers</span>
      </h2>
      <p className="text-sm md:text-md text-gray-500 max-w-4xl md:text-center text-start">
        Access every Helicone feature by just adding headers, no SDKs required.
      </p>

      <div className="w-full pr-16 grid md:pt-16 grid-cols-2 gap-8 md:grid-cols-4 md:gap-x-18 md:gap-y-10">
        {FEATURES.map((feature) => (
          <a
            key={feature.title}
            href={feature.href}
            target="_blank"
            className="flex flex-col items-start md:hover:bg-sky-100 rounded-md p-2 md:p-4"
          >
            <div>
              <h3 className="text-md md:text-lg font-bold text-sky-500">
                {feature.title}
              </h3>
              <p className="text-sm md:text-md text-gray-400 max-w-[24ch]">
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
