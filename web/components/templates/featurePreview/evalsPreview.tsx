import { useOrg } from "@/components/layout/org/organizationContext";
import FeaturePreview, { PricingPlan } from "../featurePreview/featurePreview";
import { Feature } from "../featurePreview/featurePreviewSection";
import useNotification from "@/components/shared/notification/useNotification";
import { useState } from "react";
import { useFeatureTrial } from "@/hooks/useFeatureTrial";
import { TrialConfirmationDialog } from "@/components/shared/TrialConfirmationDialog";

const evalFeatures: Feature[] = [
  {
    title: "Catch Regression Pre-Deployment",
    description: [
      "Monitor performance in real-time and catch regressions pre-deployment",
      "Evaluate outputs with LLM-as-a-judge or custom evals",
      "Connect to any major AI provider (Anthropic, OpenAI, Google, Meta, DeepSeek and more)",
    ],
    media: {
      type: "video",
      src: "https://marketing-assets-helicone.s3.us-west-2.amazonaws.com/evals1.mp4",
      fallbackImage: "/static/features/evals/feature1.png",
    },
    imageAlt: "Evaluation interface showing regression testing",
    isImageLeft: true,
    ctaText: "Start evaluating",
  },
  {
    title: "Quantify Prompt Performance",
    description: [
      "Monitor performance in real-time and catch regressions pre-deployment",
      "Evaluate outputs with LLM-as-a-judge or custom evals",
    ],
    media: {
      type: "video",
      src: "https://marketing-assets-helicone.s3.us-west-2.amazonaws.com/evals2.mp4",
      fallbackImage: "/static/features/evals/feature2.png",
    },
    imageAlt: "Performance metrics interface",
    ctaText: "Measure now",
  },
  {
    title: "Create Online Evals",
    description: [
      "Create online evaluation to capture real-world scenarios",
      "...",
    ],
    media: {
      type: "video",
      src: "https://marketing-assets-helicone.s3.us-west-2.amazonaws.com/evals3.mp4",
      fallbackImage: "/static/features/evals/feature3.png",
    },
    imageAlt: "Online evaluation interface",
    isImageLeft: true,
    ctaText: "Create eval",
  },
  {
    title: "Create offline evals",
    description: [
      "Create offline evaluation using previous requests or synthetic data",
      "...",
    ],
    media: {
      type: "video",
      src: "https://marketing-assets-helicone.s3.us-west-2.amazonaws.com/evals4.mp4",
      fallbackImage: "/static/features/evals/feature4.png",
    },
    imageAlt: "Offline evaluation interface",
    ctaText: "Test offline",
  },
];

type EvalsPricingPlanName = "Pro + Eval" | "Team Bundle";
type EvalsPlan = "evals" | "team_bundle";

const paidPlan: PricingPlan<EvalsPricingPlanName>[] = [
  {
    name: "Pro + Eval",
    price: "100",
    isSelected: true,
    priceSubtext: "+$20/seat",
    features: [
      { name: "$20/seat", included: true },
      { name: "Evals", included: true },
      { name: "Prompts (+$50/mo)", included: false },
      { name: "Experiments (+$50/mo)", included: false },
    ],
  },
  {
    name: "Team Bundle",
    price: "200",
    features: [
      { name: "Unlimited seats", included: true },
      { name: "Evals", included: true },
      { name: "Prompts", included: true },
      { name: "Experiments", included: true },
    ],
  },
];

const EvalsPreview = () => {
  const notification = useNotification();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const { handleConfirmTrial, proRequired } = useFeatureTrial("evals", "Evals");
  const [selectedPlan, setSelectedPlan] = useState<EvalsPricingPlanName>();

  const handleStartTrial = async (selectedPlan?: EvalsPricingPlanName) => {
    if (!selectedPlan) {
      notification.setNotification("Please select a plan to continue", "error");
      return;
    }
    setSelectedPlan(selectedPlan);
    setIsConfirmDialogOpen(true);
  };

  const confirmEvalsChange = async () => {
    const success = await handleConfirmTrial(selectedPlan);
    if (success) setIsConfirmDialogOpen(false);
  };

  return (
    <>
      <FeaturePreview
        title="Evaluation using"
        subtitle="LLM-as-a-Judge or Custom Evals"
        pricingPlans={paidPlan}
        proRequired={proRequired}
        onStartTrial={handleStartTrial}
        featureSectionProps={{
          pageTitle: "Catch Regression Pre-Deployment",
          features: evalFeatures,
          quote: {
            prefix: "The ability to evaluate prompts systematically",
            highlight: "increased our deployment confidence by 90%",
            suffix:
              "and helped us maintain consistent quality across all our AI features.",
          },
        }}
      />

      <TrialConfirmationDialog
        featureName={"Evals"}
        isOpen={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        onConfirm={confirmEvalsChange}
      />
    </>
  );
};

export default EvalsPreview;
