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

const freePlan: PricingPlan[] = [
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

const paidPlan: PricingPlan[] = [
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

  const addProductToSubscription = useMutation({
    mutationFn: async (productType: "alerts" | "prompts") => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const result = await jawn.POST(
        "/v1/stripe/subscription/add-ons/{productType}",
        {
          params: {
            path: {
              productType,
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

  const confirmPromptsChange = async () => {
    try {
      const { response } = await addProductToSubscription.mutateAsync(
        "prompts"
      );

      if (response.status >= 200 && response.status < 300) {
        setIsConfirmDialogOpen(false);
        notification.setNotification(
          "Your Prompts trial has begun! Refreshing page...",
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

  let pricingPlan: PricingPlan[] = [];
  let proRequired = false;
  if (org?.currentOrg?.tier === "free" || org?.currentOrg?.tier === "growth") {
    pricingPlan = paidPlan;
    proRequired = true;
  } else if (
    org?.currentOrg?.tier === "enterprise" ||
    org?.currentOrg?.tier === "pro-20240913"
  ) {
    pricingPlan = paidPlan;
    proRequired = false;
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
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start Prompts Trial</DialogTitle>
            <DialogDescription>
              Would you like to start your Prompts trial? You can cancel anytime
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
            <Button onClick={confirmPromptsChange}>Start Trial</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PromptsPreview;
