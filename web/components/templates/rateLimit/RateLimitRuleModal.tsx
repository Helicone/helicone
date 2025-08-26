"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { $JAWN_API } from "@/lib/clients/jawn";
import { logger } from "@/lib/telemetry/logger";
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
import { Result } from "@/packages/common/result"; // <-- Add Result import

// Use generated types instead of manual definitions
type CreateRateLimitPayload =
  components["schemas"]["CreateRateLimitRuleParams"];
type UpdateRateLimitPayload =
  components["schemas"]["UpdateRateLimitRuleParams"];
type RateLimitRuleView = components["schemas"]["RateLimitRuleView"];

// Zod schema for client-side validation (mirrors backend, suitable for both)
const RateLimitRuleClientSchema = z.object({
  name: z.string().min(1, "Rule Name is required."),
  quota: z.number().nonnegative("Quota must be a non-negative number."),
  window_seconds: z
    .number()
    .nonnegative("Time Window must be a non-negative number."),
  unit: z.enum(["request", "cents"]),
  segment: z
    .string()
    .optional() // Keep optional
    .refine(
      (val) =>
        val === undefined || // Allow undefined (global)
        val === "user" ||
        /^[a-zA-Z0-9_-]+$/.test(val || ""), // Allow user or valid key
      {
        message:
          "Segment must be 'user', empty (global), or a valid property key (alphanumeric/hyphen/underscore).",
      },
    ),
});

interface RateLimitRuleModalProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: (rule: RateLimitRuleView) => void;
  rule?: RateLimitRuleView; // <-- Make rule prop optional
}

const RateLimitRuleModal = ({
  open,
  onOpenChange,
  onSuccess,
  rule, // <-- Destructure optional rule
}: RateLimitRuleModalProps) => {
  const queryClient = useQueryClient();
  const org = useOrg();
  const isEditMode = !!rule; // Determine mode based on rule prop

  // State variables (from original Create modal)
  const [name, setName] = useState("");
  const [quota, setQuota] = useState("");
  const [unit, setUnit] = useState<"request" | "cents">("request");
  const [windowSeconds, setWindowSeconds] = useState("");
  const [segmentType, setSegmentType] = useState<
    "global" | "user" | "property"
  >("global");
  const [customPropertyKey, setCustomPropertyKey] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Effect to initialize/reset state based on mode
  useEffect(() => {
    if (open) {
      if (isEditMode && rule) {
        // Initialize state for Edit mode
        setName(rule.name);
        setQuota(String(rule.quota));
        setUnit(rule.unit);
        setWindowSeconds(String(rule.window_seconds));

        if (rule.segment === "user") {
          setSegmentType("user");
          setCustomPropertyKey("");
        } else if (rule.segment) {
          setSegmentType("property");
          setCustomPropertyKey(rule.segment);
        } else {
          setSegmentType("global");
          setCustomPropertyKey("");
        }
        setError(null);
      } else {
        setName("");
        setQuota("");
        setUnit("request");
        setWindowSeconds("");
        setSegmentType("global");
        setCustomPropertyKey("");
        setError(null);
      }
    }
  }, [open, rule, isEditMode]);

  const mutation = useMutation<
    Result<RateLimitRuleView | null, string>, // Return type matches Jawn PUT/POST
    Error,
    CreateRateLimitPayload | UpdateRateLimitPayload // Input type depends on mode
  >({
    mutationFn: async (
      data: CreateRateLimitPayload | UpdateRateLimitPayload,
    ): Promise<Result<RateLimitRuleView | null, string>> => {
      let resp;
      if (isEditMode && rule) {
        // Edit Mode - Use PUT
        resp = await $JAWN_API.PUT("/v1/rate-limits/{ruleId}", {
          params: { path: { ruleId: rule.id } },
          body: data as UpdateRateLimitPayload, // Cast to Update type
        });
      } else {
        // Create Mode - Use POST
        resp = await $JAWN_API.POST("/v1/rate-limits", {
          body: data as CreateRateLimitPayload, // Cast to Create type
        });
      }

      if (resp.error || !resp.data?.data) {
        logger.error(
          {
            error: resp.error,
          },
          "Failed to save rate limit rule",
        );
        throw new Error(
          resp.error || "An error occurred while saving the rule.",
        );
      }

      // Ensure return type matches expected Result structure
      return resp.data as Result<RateLimitRuleView | null, string>;
    },
    onSuccess: (resultData) => {
      // Check if data exists in the result (should for success)
      if (resultData?.data) {
        queryClient.invalidateQueries({
          queryKey: ["rateLimits", org?.currentOrg?.id],
        });
        onSuccess(resultData.data); // Pass the created/updated rule data
        onOpenChange(false); // Close modal on success
      } else {
        // Handle unexpected success case where data might be null/undefined
        logger.warn("Rate limit rule saved, but no data returned.");
        setError("Rule saved, but failed to retrieve updated data.");
        onOpenChange(false); // Still close modal
      }
    },
    onError: (error: Error) => {
      setError(error.message ?? "An unknown error occurred.");
    },
  });

  const handleSubmit = () => {
    setError(null);

    const parsedQuota = parseInt(quota, 10);
    const parsedWindowSeconds = parseInt(windowSeconds, 10);

    let segment: string | undefined;
    if (segmentType === "user") {
      segment = "user";
    } else if (segmentType === "property") {
      if (!customPropertyKey.trim()) {
        setError(
          "Property Key cannot be empty when segment type is 'Custom Property'.",
        );
        return;
      }
      segment = customPropertyKey.trim();
    }

    // Prepare data using the schema structure expected by the API
    const formData = {
      name: name.trim(),
      quota: isNaN(parsedQuota) ? undefined : parsedQuota, // Use undefined if NaN for Zod
      window_seconds: isNaN(parsedWindowSeconds)
        ? undefined
        : parsedWindowSeconds, // Use undefined if NaN
      unit: unit,
      segment: segment,
    };

    // Validate using Zod
    const validationResult = RateLimitRuleClientSchema.safeParse(formData);

    if (!validationResult.success) {
      const formattedErrors = validationResult.error.errors
        .map((e) => `${e.path.join(".")} (${e.code}): ${e.message}`) // More detailed error
        .join("\n");
      setError(formattedErrors);
      return;
    }

    mutation.mutate(validationResult.data);
  };

  // Use the passed-in handler, but clear errors when closing
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setError(null); // Clear errors when closing
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          {/* Conditional Title/Description */}
          <DialogTitle>
            {isEditMode ? "Edit Rate Limit Rule" : "Create New Rate Limit Rule"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Modify the details of this rate limit rule."
              : "Define a specific rate limit constraint. Requests must satisfy all applicable active rules."}
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
                  <SelectItem value="request">Requests</SelectItem>
                  <SelectItem value="cents">Cents</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="windowSeconds" className="pt-2 text-right">
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
                    setCustomPropertyKey(""); // Reset custom key if not property type
                  }
                }}
                disabled={mutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select scope..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">All Requests (Global)</SelectItem>
                  <SelectItem value="user">Each User ID</SelectItem>{" "}
                  {/* Updated label */}
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
                placeholder='e.g., "customerId" or "X-Feature-Flag"'
                disabled={mutation.isPending}
              />
            </div>
          )}
        </div>
        {error && (
          <div className="px-4 pb-2 text-sm text-destructive">
            {" "}
            {/* Adjusted padding */}
            <P className="mb-1 font-semibold">Error</P>
            <pre className="font-sans whitespace-pre-wrap">{error}</pre>
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
            onClick={handleSubmit}
            disabled={mutation.isPending || !name || !quota || !windowSeconds} // Ensuring this line is correct
          >
            {/* Conditional Button Text */}
            {mutation.isPending
              ? isEditMode
                ? "Saving..."
                : "Creating..."
              : isEditMode
                ? "Save Changes"
                : "Create Rule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RateLimitRuleModal; // <-- Renamed export
