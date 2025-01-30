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

  const addProductToSubscription = useMutation({
    mutationFn: async (productType: "alerts" | "experiments") => {
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

  const confirmExperimentsChange = async () => {
    try {
      const { response } = await addProductToSubscription.mutateAsync(
        "experiments"
      );

      if (response.status >= 200 && response.status < 300) {
        setIsConfirmDialogOpen(false);
        notification.setNotification(
          "Your Experiments trial has begun! Refreshing page...",
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
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start Experiments Trial</DialogTitle>
            <DialogDescription>
              Would you like to start your Experiments trial? You can cancel
              anytime during the trial period.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmExperimentsChange}>Start Trial</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExperimentsPreview;
