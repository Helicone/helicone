"use client";

import { useState } from "react";
import { z } from "zod";
import { $JAWN_API } from "@/lib/clients/jawn";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/components/layout/org/organizationContext"; // Import useOrg
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { P } from "@/components/ui/typography";
import { components } from "@/lib/clients/jawnTypes/private"; // Import generated types

// Use generated types instead of manual definitions
type CreateRateLimitPayload =
  components["schemas"]["CreateRateLimitRuleParams"];
type RateLimitRuleView = components["schemas"]["RateLimitRuleView"];

// Zod schema for client-side validation (mirrors backend)
const CreateRateLimitRuleClientSchema = z.object({
  name: z.string().min(1, "Rule Name is required."),
  quota: z.number().nonnegative("Quota must be a non-negative number."),
  window_seconds: z
    .number()
    .nonnegative("Time Window must be a non-negative number."),
  unit: z.enum(["request", "cents"]),
  segment: z
    .string()
    .regex(/^[a-zA-Z0-9_-]*$/, {
      message:
        "Segment property key must be alphanumeric characters including underscores and hyphens.",
    })
    .refine(
      (val) => val === "" || val === "user" || /^[a-zA-Z0-9_-]+$/.test(val),
      {
        message:
          "Segment must be 'user', empty (global), or a valid property key (alphanumeric/hyphen/underscore).",
      }
    )
    .optional(),
});

interface CreateRateLimitRuleModalProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: (newRule: RateLimitRuleView) => void;
}

const CreateRateLimitRuleModal = ({
  open,
  onOpenChange,
  onSuccess,
}: CreateRateLimitRuleModalProps) => {
  const queryClient = useQueryClient();
  const org = useOrg();

  const [name, setName] = useState("");
  const [quota, setQuota] = useState("");
  const [unit, setUnit] = useState<"request" | "cents">("request");
  const [windowSeconds, setWindowSeconds] = useState("");
  const [segmentType, setSegmentType] = useState<
    "global" | "user" | "property"
  >("global");
  const [customPropertyKey, setCustomPropertyKey] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation<
    RateLimitRuleView,
    Error,
    CreateRateLimitPayload
  >({
    mutationFn: async (
      data: CreateRateLimitPayload
    ): Promise<RateLimitRuleView> => {
      const resp = await $JAWN_API.POST("/v1/rate-limits", {
        body: data,
      });

      if (resp.error || !resp.data.data) {
        console.error("Failed to create rate limit rule:", resp.error);
        throw new Error(
          resp.error || "An error occurred while creating the rule."
        );
      }

      return resp.data.data as RateLimitRuleView;
    },
    onSuccess: (newRuleData) => {
      queryClient.invalidateQueries({
        queryKey: ["rateLimits", org?.currentOrg?.id],
      });
      onSuccess(newRuleData);
      onOpenChange(false);
      setName("");
      setQuota("");
      setUnit("request");
      setWindowSeconds("");
      setSegmentType("global");
      setCustomPropertyKey("");
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message ?? "An unknown error occurred.");
    },
  });

  const handleCreate = () => {
    setError(null);

    const parsedQuota = parseInt(quota, 10);
    const parsedWindowSeconds = parseInt(windowSeconds, 10);

    let segment = undefined;
    if (segmentType === "user") {
      segment = "user";
    } else if (segmentType === "property") {
      if (!customPropertyKey.trim()) {
        setError(
          "Property Key cannot be empty when segment type is 'Custom Property'."
        );
        return;
      }
      segment = customPropertyKey.trim();
    }

    const formData: CreateRateLimitPayload = {
      name: name.trim(),
      quota: isNaN(parsedQuota) ? NaN : parsedQuota,
      window_seconds: isNaN(parsedWindowSeconds) ? NaN : parsedWindowSeconds,
      unit: unit,
      segment: segment ?? undefined,
    };

    const validationResult =
      CreateRateLimitRuleClientSchema.safeParse(formData);

    if (!validationResult.success) {
      const formattedErrors = validationResult.error.errors
        .map((e) => e.message)
        .join("\n");
      setError(formattedErrors);
      return;
    }

    mutation.mutate(validationResult.data);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setError(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create New Rate Limit Rule</DialogTitle>
          <DialogDescription>
            Define a specific rate limit constraint. Requests must satisfy all
            applicable active rules.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Rule Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder='e.g., "Free Tier Daily Limit"'
              disabled={mutation.isPending}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quota" className="text-right">
              Quota
            </Label>
            <div className="col-span-3 grid grid-cols-2 gap-2">
              <Input
                id="quota"
                type="number"
                value={quota}
                onChange={(e) => setQuota(e.target.value)}
                placeholder="e.g., 1000"
                min="0"
                disabled={mutation.isPending}
              />
              <Select
                value={unit}
                onValueChange={(value: "request" | "cents") => setUnit(value)}
                disabled={mutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="request">Request</SelectItem>
                  <SelectItem value="cents">Cents</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="windowSeconds" className="text-right pt-2">
              Time Window (sec)
            </Label>
            <Input
              id="windowSeconds"
              type="number"
              className="col-span-3"
              value={windowSeconds}
              onChange={(e) => setWindowSeconds(e.target.value)}
              placeholder="e.g., 3600 (for 1 hour)"
              min="0"
              disabled={mutation.isPending}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="segmentType" className="text-right">
              Apply To
            </Label>
            <div className="col-span-3">
              <Select
                value={segmentType}
                onValueChange={(value: "global" | "user" | "property") => {
                  setSegmentType(value);
                  if (value !== "property") {
                    setCustomPropertyKey("");
                  }
                }}
                disabled={mutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select scope..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">All Requests (Global)</SelectItem>
                  <SelectItem value="user">Each User</SelectItem>
                  <SelectItem value="property">Custom Property</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {segmentType === "property" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customPropertyKey" className="text-right">
                Property Key
              </Label>
              <Input
                id="customPropertyKey"
                value={customPropertyKey}
                onChange={(e) => setCustomPropertyKey(e.target.value)}
                className="col-span-3"
                placeholder='e.g., "organization_id" or "feature-flag"'
                disabled={mutation.isPending}
              />
            </div>
          )}
        </div>
        {error && (
          <div className="px-6 pb-2 text-sm text-destructive">
            <P className="font-semibold mb-1">Error</P>
            <pre className="whitespace-pre-wrap font-sans">{error}</pre>
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleCreate}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Creating..." : "Create Rule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRateLimitRuleModal;
