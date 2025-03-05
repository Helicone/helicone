import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { H3, P, Small, Muted } from "@/components/ui/typography";

export interface HeliconeFeature {
  id: string;
  name: string;
  description: string;
}

const HELICONE_FEATURES: HeliconeFeature[] = [
  {
    id: "prompts",
    name: "Prompts",
    description:
      "Version, track, and optimize your prompts with templates and variables.",
  },
  {
    id: "sessions",
    name: "Sessions",
    description:
      "Group and visualize multi-step LLM interactions across multiple traces.",
  },
  {
    id: "custom-properties",
    name: "Custom Properties",
    description:
      "Add custom metadata to LLM requests for advanced segmentation and analysis.",
  },
  {
    id: "user-metrics",
    name: "User Metrics",
    description:
      "Monitor individual user interactions with your LLM applications.",
  },
  {
    id: "caching",
    name: "Caching",
    description:
      "Reduce latency and save costs on LLM calls by caching responses on the edge.",
  },
  {
    id: "retries",
    name: "Retries",
    description:
      "Automatically retry failed LLM requests using intelligent exponential backoff.",
  },
  {
    id: "rate-limits",
    name: "Custom Rate Limits",
    description:
      "Set custom rate limits for model provider API calls to manage expenses.",
  },
  {
    id: "security",
    name: "LLM Security",
    description:
      "Enable robust security measures to protect against prompt injections and data exfiltration.",
  },
];

interface HeliconeFeatureSelectorProps {
  selectedFeatures: Record<string, boolean>;
  onChange: (features: Record<string, boolean>) => void;
}

export function HeliconeFeatureSelector({
  selectedFeatures,
  onChange,
}: HeliconeFeatureSelectorProps) {
  const handleFeatureToggle = (featureId: string) => {
    const updatedFeatures = {
      ...selectedFeatures,
      [featureId]: !selectedFeatures[featureId],
    };
    onChange(updatedFeatures);
  };

  return (
    <Card>
      <CardHeader>
        <H3>Helicone Features</H3>
        <P>
          Select which Helicone features you want to include in your
          integration:
        </P>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {HELICONE_FEATURES.map((feature) => (
            <div
              key={feature.id}
              className="flex items-start gap-2 border border-border p-4 rounded-md hover:bg-muted transition-colors"
            >
              <Checkbox
                id={feature.id}
                checked={selectedFeatures[feature.id] || false}
                onCheckedChange={() => handleFeatureToggle(feature.id)}
              />
              <div className="flex flex-col gap-1">
                <Label htmlFor={feature.id} className="cursor-pointer">
                  {feature.name}
                </Label>
                <Muted>{feature.description}</Muted>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
