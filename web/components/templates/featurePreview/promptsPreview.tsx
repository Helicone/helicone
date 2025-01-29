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
    media: {
      type: "video",
      src: "https://marketing-assets-helicone.s3.us-west-2.amazonaws.com/prompts1_fs.mp4",
      fallbackImage: "/static/features/prompts/feature1.png",
    },
    imageAlt: "Prompt building interface",
    isImageLeft: true,
    ctaText: "Start building",
  },
  {
    title: "Control Every Version of Your Prompts",
    description: [
      "Track versions automatically in code or manually in UI",
      "Switch, promote, or rollback versions instantly",
      "Track commit messages to understand why changes were made",
      "Deploy any version using just the prompt ID",
    ],
    media: {
      type: "video",
      src: "https://marketing-assets-helicone.s3.us-west-2.amazonaws.com/prompts2_fs.mp4",
      fallbackImage: "/static/features/prompts/feature2.png",
    },
    imageAlt: "Version control interface",
    ctaText: "Deploy now",
  },
  {
    title: "Prompt Editor Copilot",
    description: [
      "Write prompts faster with auto-complete and smart suggestions",
      "Add variables (⌘E) and XML delimiters (⌘J) with quick shortcuts",
      "Perform any edits you describe with natural language (⌘K)",
    ],
    media: {
      type: "video",
      src: "https://marketing-assets-helicone.s3.us-west-2.amazonaws.com/prompts3_fs.mp4",
      fallbackImage: "/static/features/prompts/feature3.png",
    },
    imageAlt: "Prompt testing interface",
    isImageLeft: true,
    ctaText: "Start editing",
  },
  {
    title: "Test Prompts in Real-Time",
    description: [
      "Edit and run prompts side-by-side with instant feedback",
      "Experiment with different models, messages, temperatures, and parameters",
    ],
    media: {
      type: "video",
      src: "https://marketing-assets-helicone.s3.us-west-2.amazonaws.com/prompts4_fs.mp4",
      fallbackImage: "/static/features/prompts/feature4.png",
    },
    imageAlt: "Prompt testing interface",
    isImageLeft: false,
    ctaText: "Test prompts",
  },
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
