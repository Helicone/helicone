import { useOrg } from "@/components/layout/org/organizationContext";
import FeaturePreview, { PricingPlan } from "../featurePreview/featurePreview";
import { Feature } from "../featurePreview/featurePreviewSection";
import { getJawnClient } from "@/lib/clients/jawn";
import { useMutation, useQuery } from "@tanstack/react-query";
import useNotification from "@/components/shared/notification/useNotification";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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

const paidPlan: PricingPlan[] = [
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
  const org = useOrg();
  const notification = useNotification();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const addProductToSubscription = useMutation({
    mutationFn: async (productType: "alerts") => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const result = await jawn.POST(
        "/v1/stripe/subscription/add-ons/{productType}",
        {
          params: {
            path: {
              productType: "alerts",
            },
          },
        }
      );
      return result;
    },
  });

  const subscription = useQuery({
    queryKey: ["subscription", org?.currentOrg?.id],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const jawn = getJawnClient(orgId);
      const subscription = await jawn.GET("/v1/stripe/subscription");
      return subscription;
    },
  });

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

  const confirmEvalsChange = async () => {
    try {
      const { response } = await addProductToSubscription.mutateAsync("alerts");

      if (response.status >= 200 && response.status < 300) {
        setIsConfirmDialogOpen(false);
        notification.setNotification(
          "Your Evals trial has begun! Refreshing page...",
          "success"
        );
        await subscription.refetch();
      } else {
        setIsConfirmDialogOpen(false);
        notification.setNotification(
          "Failed to start trial. Please try again or contact support.",
          "error"
        );
      }
    } catch (error) {
      setIsConfirmDialogOpen(false);
      notification.setNotification(
        "Failed to start trial. Please try again or contact support.",
        "error"
      );
    }
  };

  let proRequired =
    org?.currentOrg?.tier === "free" || org?.currentOrg?.tier === "growth";

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

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start Evals Trial</DialogTitle>
            <DialogDescription>
              Would you like to start your Evals trial? You can cancel anytime
              during the trial period.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmEvalsChange}>Start Trial</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EvalsPreview;
