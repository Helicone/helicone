import FeaturePreview, { PricingPlan } from "../featurePreview/featurePreview";
import { Feature } from "../featurePreview/featurePreviewSection";
import useNotification from "@/components/shared/notification/useNotification";
import { useMemo, useState } from "react";
import { useFeatureTrial } from "@/hooks/useFeatureTrial";
import { TrialConfirmationDialog } from "@/components/shared/TrialConfirmationDialog";
import EvaluateSVG from "@/components/ui/evaluate";
import { useOrg } from "@/components/layout/org/organizationContext";

const evalFeatures: Feature[] = [
  {
    title: "Catch Regression Pre-Deployment",
    description: [
      "Three evaluation modes: LLM-as-a-Judge, executable Python (CodeSandbox), and LastMileAI RAG evals",
      "Leverage LastMileAI's RAG-specific metrics including faithfulness, relevance, and answer quality scoring",
      "Integrated with all major AI providers (Anthropic, OpenAI, Google, Meta, DeepSeek)",
    ],
    media: {
      type: "component",
      component: () => <EvaluateSVG />,
      fallbackImage: "/static/features/evals/feature1.png",
    },
    imageAlt: "Evaluation interface showing regression testing",
    isImageLeft: true,
    ctaText: "Start evaluating",
  },
  {
    title: "Online Evals & Production Monitoring",
    description: [
      "Attach evals to any filter (prompt, environment, etc.) with configurable sampling rates",
      "Real-time dashboards track eval performance alongside request metrics",
      "Compare results across model versions and prompt iterations",
    ],
    media: {
      type: "video",
      src: "https://marketing-assets-helicone.s3.us-west-2.amazonaws.com/online_evals.mp4",
      fallbackImage: "/static/features/evals/feature2.png",
    },
    imageAlt: "Production monitoring and evaluation interface",
    ctaText: "Configure Monitoring",
  },
  {
    title: "Offline Evals for Experimentation",
    description: [
      "Integrated with Experiments for pre-deployment validation",
      "Maintain eval consistency between development and production",
      "Batch test prompts against historical data or synthetic datasets",
    ],
    media: {
      type: "video",
      src: "https://marketing-assets-helicone.s3.us-west-2.amazonaws.com/evals_experiments.mp4",
      fallbackImage: "/static/features/evals/feature4.png",
    },
    imageAlt: "Offline evaluation interface",
    isImageLeft: true,
    ctaText: "Prevent Regressions",
  },
];

type EvalsPricingPlanName = "Evals" | "Pro + Eval" | "Team Bundle";

const freePlan: PricingPlan<EvalsPricingPlanName>[] = [
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

const paidPlan: PricingPlan<EvalsPricingPlanName>[] = [
  {
    name: "Evals",
    price: "100",
    isSelected: true,
    features: [
      { name: "Pro seats (current plan)", included: true },
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
  const org = useOrg();
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

  const pricingPlan: PricingPlan<EvalsPricingPlanName>[] = useMemo(() => {
    if (
      org?.currentOrg?.tier === "free" ||
      org?.currentOrg?.tier === "growth"
    ) {
      return freePlan;
    } else if (
      org?.currentOrg?.tier === "enterprise" ||
      org?.currentOrg?.tier === "pro-20240913" ||
      org?.currentOrg?.tier === "team-20250130"
    ) {
      return paidPlan;
    }
    return [];
  }, [org]);

  return (
    <>
      <FeaturePreview
        title="LLM Evaluation Suite"
        subtitle="for Performance Optimization"
        pricingPlans={pricingPlan}
        proRequired={proRequired}
        onStartTrial={handleStartTrial}
        featureSectionProps={{
          pageTitle: "Evaluate Pre-Deployment and Monitor Production",
          features: evalFeatures,
          quote: {
            prefix: '"The ability to evaluate prompts systematically',
            highlight: "increased our deployment confidence by 90%",
            suffix:
              'and helped us maintain consistent quality across all our AI features."',
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
