import { UnionProviderMethods } from "@/types";

// import { Tier } from "../components/templates/usage/usagePage";

export const DEMO_EMAIL = "valyrdemo@gmail.com";

export const ORG_ID_COOKIE_KEY = "currentOrgId";

interface UnionProviderOption {
  val: UnionProviderMethods;
  label: string;
}

export const PROVIDER_METHODS: UnionProviderOption[] = [
  { val: "openai-proxy", label: "OpenAI proxy" },
  { val: "openai-async", label: "OpenAI async" },
  { val: "anthropic-proxy", label: "Anthropic proxy" },
];

// export const REQUEST_LIMITS: Record<Tier, number> = {
//   free: 100_000,
//   starter: 500_000,
//   "starter-pending-cancel": 500_000,
//   enterprise: 10_000_000,
// };
