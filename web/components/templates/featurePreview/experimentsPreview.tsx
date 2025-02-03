import FeaturePreview, { PricingPlan } from "../featurePreview/featurePreview";
import { Feature } from "../featurePreview/featurePreviewSection";
import useNotification from "@/components/shared/notification/useNotification";
import { useMemo, useState } from "react";
import { useFeatureTrial } from "@/hooks/useFeatureTrial";
import { TrialConfirmationDialog } from "@/components/shared/TrialConfirmationDialog";
import { useOrg } from "@/components/layout/org/organizationContext";
import Experiment from "./experiment";
import EvaluateSVG from "@/components/ui/evaluate";

type ExperimentPricingPlanName =
  | "Experiments"
  | "Pro + Experiments"
  | "Team Bundle";

const experimentFeatures: Feature[] = [
  {
    title: "Tune your LLM prompts\nfor production",
    description: [
      "Test different prompts, models, and parameters side-by-side to find optimal combinations",
      "Start experimenting from any source - scratch prompts, existing requests, or templates",
      "Connect to any major AI provider (Anthropic, OpenAI, Google, Meta, DeepSeek and more)",
    ],
    media: {
      type: "component",
      component: () => <Experiment />,
    },
    imageAlt: "Experiment interface showing multiple prompts",
    isImageLeft: true,
    ctaText: "Start experimenting",
  },
  {
    title: "Test Prompts with Historic & Real-World Data",
    description: [
      "Identify and optimize for edge cases using real production data",
      "Adjust prompt before pushing to production",
      "Validate changes against historical requests",
    ],
    media: {
      type: "video",
      src: "https://marketing-assets-helicone.s3.us-west-2.amazonaws.com/experiments_last.mp4",
      fallbackImage: "/static/features/experiments/feature3.png",
    },
    imageAlt: "Historical data testing interface",
    isImageLeft: false,
    ctaText: "Test with real-world data",
  },
  {
    title: "Evaluate Responses with Offline Testing",
    description: [
      "Quantify response quality using LLM-as-judge or Python evaluators",
      "Attach evaluators to experiments to track performance across iterations and model versions",
      "Optimize edge cases using heatmap visualizations of scored responses",
    ],
    media: {
      type: "video",
      src: "https://marketing-assets-helicone.s3.us-west-2.amazonaws.com/evals_experiments.mp4",
      fallbackImage: "/static/features/experiments/feature2.png",
    },
    imageAlt: "Evaluation interface showing heatmap of scored responses",
    isImageLeft: true,
    ctaText: "Enable evals",
    ctaLink: "/evaluators",
  },
];

const freePlan: PricingPlan<ExperimentPricingPlanName>[] = [
  {
    name: "Pro + Experiments",
    price: "50",
    isSelected: true,
    priceSubtext: "+$20/seat",
    features: [
      { name: "$20/seat", included: true },
      { name: "Experiments", included: true },
      { name: "Prompts (+$50/mo)", included: false },
      { name: "Evals (+$100/mo)", included: false },
    ],
  },
  {
    name: "Team Bundle",
    price: "200",
    features: [
      { name: "Unlimited seats", included: true },
      { name: "Experiments", included: true },
      { name: "Prompts", included: true },
      { name: "Evals", included: true },
    ],
  },
];

const paidPlan: PricingPlan<ExperimentPricingPlanName>[] = [
  {
    name: "Experiments",
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

const ExperimentsPreview = () => {
  const org = useOrg();
  const notification = useNotification();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const { handleConfirmTrial } = useFeatureTrial("experiments", "Experiments");
  const [selectedPlan, setSelectedPlan] = useState<ExperimentPricingPlanName>();

  const isPaidPlan = useMemo(
    () =>
      org?.currentOrg?.tier === "enterprise" ||
      org?.currentOrg?.tier === "pro-20240913" ||
      org?.currentOrg?.tier === "pro-20250202" ||
      org?.currentOrg?.tier === "team-20250130",
    [org?.currentOrg?.tier]
  );

  const pricingPlan = useMemo(
    () => (isPaidPlan ? paidPlan : freePlan),
    [isPaidPlan]
  );

  const handleStartTrial = async (selectedPlan?: ExperimentPricingPlanName) => {
    if (!selectedPlan) {
      notification.setNotification("Please select a plan to continue", "error");
      return;
    }
    setSelectedPlan(selectedPlan);
    setIsConfirmDialogOpen(true);
  };

  const confirmExperimentsChange = async () => {
    const success = await handleConfirmTrial(selectedPlan);
    if (success) setIsConfirmDialogOpen(false);
  };

  if (!org?.currentOrg) {
    return null;
  }

  console.log(`Requires upgrade: ${isPaidPlan}`);

  return (
    <>
      <FeaturePreview
        title="Prompt Experimentation"
        subtitle="in a Spreadsheet-Like Environment"
        pricingPlans={pricingPlan}
        onStartTrial={handleStartTrial}
        isOnFreeTier={!isPaidPlan}
        featureSectionProps={{
          pageTitle: "Tune and Test Prompts at Scale",
          features: experimentFeatures,
          quote: {
            prefix:
              '"Being able to experiment with different prompts and models',
            highlight: "cut our optimization time in half",
            suffix:
              'and helped us find the perfect balance of cost and performance."',
          },
        }}
      />
      <TrialConfirmationDialog
        featureName="Experiments"
        isOpen={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        onConfirm={confirmExperimentsChange}
        isUpgrade={isPaidPlan}
      />
    </>
  );
};

export default ExperimentsPreview;
