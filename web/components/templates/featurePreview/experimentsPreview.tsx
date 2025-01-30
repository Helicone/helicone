import { useOrg } from "@/components/layout/org/organizationContext";
import FeaturePreview, { PricingPlan } from "../featurePreview/featurePreview";
import { Feature } from "../featurePreview/featurePreviewSection";
import useNotification from "@/components/shared/notification/useNotification";
import { useState } from "react";
import { useFeatureTrial } from "@/hooks/useFeatureTrial";
import { TrialConfirmationDialog } from "@/components/shared/TrialConfirmationDialog";

const experimentFeatures: Feature[] = [
  {
    title: "Tune your LLM prompts\nfor production",
    description: [
      "Test different prompts, models, and parameters side-by-side to find optimal combinations",
      "Start experimenting from any source - scratch prompts, existing requests, or templates",
      "Connect to any major AI provider (Anthropic, OpenAI, Google, Meta, DeepSeek and more)",
    ],
    media: {
      type: "video",
      src: "https://marketing-assets-helicone.s3.us-west-2.amazonaws.com/experiments1.mp4",
      fallbackImage: "/static/features/experiments/feature1.png",
    },
    imageAlt: "Experiment interface showing multiple prompts",
    isImageLeft: true,
    ctaText: "Start experimenting",
  },
  {
    title: "Rapidly Iterate on Prompt and Model Variations",
    description: [
      "Compare responses across different models and parameters in real-time",
      "Save and share experiment results with your team",
      "Track costs and performance metrics for each variation",
    ],
    media: {
      type: "video",
      src: "https://marketing-assets-helicone.s3.us-west-2.amazonaws.com/experiments2.mp4",
      fallbackImage: "/static/features/experiments/feature2.png",
    },
    imageAlt: "Experiment comparison interface",
    ctaText: "Compare now",
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
      src: "https://marketing-assets-helicone.s3.us-west-2.amazonaws.com/experiments3.mp4",
      fallbackImage: "/static/features/experiments/feature3.png",
    },
    imageAlt: "Historical data testing interface",
    isImageLeft: true,
    ctaText: "Test with data",
  },
];

const paidPlan: PricingPlan[] = [
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

const ExperimentsPreview = () => {
  const org = useOrg();
  const notification = useNotification();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const { handleConfirmTrial, proRequired } = useFeatureTrial(
    "experiments",
    "Experiments"
  );

  const handleStartTrial = async (selectedPlan?: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!selectedPlan) {
        notification.setNotification(
          "Please select a plan to continue",
          "error"
        );
        return;
      }
      setIsConfirmDialogOpen(true);
    });
  };

  const confirmExperimentsChange = async () => {
    try {
      const success = await handleConfirmTrial();
      if (success) {
        setIsConfirmDialogOpen(false);
      }
    } catch (error) {
      setIsConfirmDialogOpen(false);
      notification.setNotification(
        "Failed to start trial. Please try again or contact support.",
        "error"
      );
    }
  };

  return (
    <>
      <FeaturePreview
        title="Prompt Experimentation"
        subtitle="in a Spreadsheet-Like Environment"
        pricingPlans={paidPlan}
        proRequired={proRequired}
        onStartTrial={handleStartTrial}
        featureSectionProps={{
          pageTitle: "Tune and Test Prompts at Scale",
          features: experimentFeatures,
          quote: {
            prefix:
              "Being able to experiment with different prompts and models",
            highlight: "cut our optimization time in half",
            suffix:
              "and helped us find the perfect balance of cost and performance.",
          },
        }}
      />
      <TrialConfirmationDialog
        featureName="Experiments"
        isOpen={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        onConfirm={confirmExperimentsChange}
      />
    </>
  );
};

export default ExperimentsPreview;
