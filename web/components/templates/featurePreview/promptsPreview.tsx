import FeaturePreview, { PricingPlan } from "../featurePreview/featurePreview";
import FeaturePreviewSection, {
  Feature,
} from "../featurePreview/featurePreviewSection";

const promptFeatures: Feature[] = [
  {
    title: "Build and Deploy\nProduction-Ready Prompts",
    description: [
      "Design prompts collaboratively in UI or manage directly in code",
      "Create templates with variables and track real production inputs",
      "Connect to any major AI provider (Anthropic, OpenAI, Google, Meta, DeepSeek and more)",
    ],
    imageSrc: "/static/features/prompts/feature1.png",
    imageAlt: "Prompt building interface",
    isImageLeft: true,
  },
  {
    title: "Control Every Version of Your Prompts",
    description: [
      "Track versions automatically in code or manually in UI",
      "Switch, promote, or rollback versions instantly",
      "Track commit messages to understand why changes were made",
      "Deploy any version using just the prompt ID",
    ],
    imageSrc: "/static/features/prompts/feature2.png",
    imageAlt: "Version control interface",
  },
  // ... other prompt features
];

const pricingPlans: PricingPlan[] = [
  {
    name: "Pro + Prompt",
    price: "50",
    isSelected: true,
    features: [
      { name: "$20/seat", included: true },
      { name: "Prompts", included: true },
      {
        name: "Experiments",
        included: false,
        additionalCost: "+$50/mo",
      },
      { name: "Evals", included: false, additionalCost: "+$100/mo" },
    ],
  },
  {
    name: "Team Bundle",
    price: "200",
    features: [
      { name: "Unlimited seats", included: true },
      { name: "Prompts", included: true },
      { name: "Experiments", included: true },
      { name: "Evals", included: true },
    ],
  },
];

const PromptsPreview = () => {
  return (
    <>
      <FeaturePreview
        title="Prompt Management"
        subtitle="in a Shared Workspace"
        proRequiredText="Adding prompt management requires a Pro plan"
        pricingPlans={pricingPlans}
        pageTitle="Create, Version and Test Prompts Collaboratively"
        features={promptFeatures}
        ctaImage="/static/features/prompts/cta.png"
      />
    </>
  );
};

export default PromptsPreview;
