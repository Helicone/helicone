import { useOrg } from "@/components/layout/org/organizationContext";
import FeaturePreview, { PricingPlan } from "../featurePreview/featurePreview";
import { Feature } from "../featurePreview/featurePreviewSection";
import useNotification from "@/components/shared/notification/useNotification";
import { useState } from "react";
import { useFeatureTrial } from "@/hooks/useFeatureTrial";
import { TrialConfirmationDialog } from "@/components/shared/TrialConfirmationDialog";

type PromptPricingPlanName = "Prompt" | "Pro + Prompt" | "Team Bundle";

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
      src: "https://marketing-assets-helicone.s3.us-west-2.amazonaws.com/prompts1_2.mp4",
      fallbackImage: "/static /features/prompts/feature1.png",
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
      src: "https://marketing-assets-helicone.s3.us-west-2.amazonaws.com/prompts2_2.mp4",
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
      src: "https://marketing-assets-helicone.s3.us-west-2.amazonaws.com/prompts3_2.mp4",
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
      src: "https://marketing-assets-helicone.s3.us-west-2.amazonaws.com/prompts4_2.mp4",
      fallbackImage: "/static/features/prompts/feature4.png",
    },
    imageAlt: "Prompt testing interface",
    isImageLeft: false,
    ctaText: "Test prompts",
  },
];

const freePlan: PricingPlan<PromptPricingPlanName>[] = [
  {
    name: "Pro + Prompt",
    price: "50",
    isSelected: true,
    priceSubtext: "+$20/seat",
    features: [
      { name: "+ $20/seat", included: true },
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

const paidPlan: PricingPlan<PromptPricingPlanName>[] = [
  {
    name: "Prompt",
    price: "50",
    isSelected: true,
    features: [
      { name: "Pro seats (current plan)", included: true },
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
  const org = useOrg();
  const notification = useNotification();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const { handleConfirmTrial, proRequired } = useFeatureTrial(
    "prompts",
    "Prompts"
  );
  const [selectedPlan, setSelectedPlan] = useState<PromptPricingPlanName>();

  const handleStartTrial = async (selectedPlan?: PromptPricingPlanName) => {
    if (!selectedPlan) {
      notification.setNotification("Please select a plan to continue", "error");
      return;
    }
    setSelectedPlan(selectedPlan);
    setIsConfirmDialogOpen(true);
  };

  const confirmPromptsChange = async () => {
    const success = await handleConfirmTrial(selectedPlan);
    if (success) setIsConfirmDialogOpen(false);
  };

  let pricingPlan: PricingPlan<PromptPricingPlanName>[] = [];
  if (org?.currentOrg?.tier === "free" || org?.currentOrg?.tier === "growth") {
    pricingPlan = freePlan;
  } else if (
    org?.currentOrg?.tier === "enterprise" ||
    org?.currentOrg?.tier === "pro-20240913"
  ) {
    pricingPlan = paidPlan;
  }

  return (
    <>
      <FeaturePreview
        title="Prompt Management"
        subtitle="in a Shared Workspace"
        pricingPlans={pricingPlan}
        proRequired={proRequired}
        onStartTrial={handleStartTrial}
        featureSectionProps={{
          pageTitle: "Create, Version and Test Prompts Collaboratively",
          features: promptFeatures,
          quote: {
            prefix:
              "The ability to test prompt variations on production traffic without touching a line of code is magical.",
            highlight: "It feels like we're cheating; it's just that good!",
            suffix: "",
          },
        }}
      />
      <TrialConfirmationDialog
        featureName="Prompts"
        isOpen={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        onConfirm={confirmPromptsChange}
      />
    </>
  );
};

export default PromptsPreview;
