import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import { useStripeKey } from "@/services/hooks/useStripeKey";
import { useIntegration } from "@/services/hooks/useIntegrations";

import useNotification from "@/components/shared/notification/useNotification";
import { $JAWN_API } from "@/lib/clients/jawn";

interface StripeConfigProps {
  onClose: () => void;
}

const StripeConfig: React.FC<StripeConfigProps> = ({ onClose }) => {
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [eventName, setEventName] = useState("helicone_request");
  const [testCustomerId, setTestCustomerId] = useState("");
  const [testResult, setTestResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const { setNotification } = useNotification();
  const { existingKey, isLoadingVault, saveKey, isSavingKey } = useStripeKey();
  const {
    integration,
    isLoadingIntegration,
    updateIntegration,
    isUpdatingIntegration,
  } = useIntegration("stripe");

  const testMeterEvent = $JAWN_API.useMutation(
    "post",
    "/v1/integration/{integrationId}/stripe/test-meter-event",
    {
      onSuccess: (data) => {
        const message =
          typeof data.data === "string"
            ? data.data
            : "Test meter event sent successfully!";
        setTestResult({ type: "success", message });
        setNotification("Test meter event sent successfully!", "success");
      },
      onError: (error: any) => {
        let errorMessage = "Unknown error";

        if (typeof error === "string") {
          errorMessage = error;
        } else if (error?.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error?.message) {
          errorMessage = error.message;
        } else if (error?.data?.error) {
          errorMessage = error.data.error;
        } else {
          errorMessage = JSON.stringify(error);
        }

        setTestResult({ type: "error", message: errorMessage });
        setNotification(`Test failed: ${errorMessage}`, "error");
      },
    },
  );

  useEffect(() => {
    if (existingKey?.provider_key) setApiKey(existingKey.provider_key);
    if (
      integration?.settings?.event_name &&
      typeof integration.settings.event_name === "string"
    ) {
      setEventName(integration.settings.event_name);
    }
  }, [existingKey, integration]);

  const isSaving = isSavingKey || isUpdatingIntegration;
  const isLoading = isLoadingVault || isLoadingIntegration;

  const handleSave = async () => {
    try {
      await saveKey(apiKey);

      // Update integration settings with event_name and enable if not already active
      updateIntegration({
        autoDatasetSync: false,
        active: true,
        event_name: eventName,
      });

      onClose();
    } catch (error) {
      // Error notifications are already handled in the hooks
      console.error("Failed to save Stripe configuration:", error);
    }
  };

  const handleTestMeterEvent = () => {
    if (!eventName || !testCustomerId) return;

    // Clear previous test result
    setTestResult(null);

    // Create or use existing integration for testing
    if (integration?.id) {
      testMeterEvent.mutate({
        params: { path: { integrationId: integration.id } },
        body: {
          event_name: eventName,
          customer_id: testCustomerId,
        },
      });
    } else {
      const errorMessage = "Please save your configuration first to test";
      setTestResult({ type: "error", message: errorMessage });
      setNotification(errorMessage, "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Stripe Integration</h2>
        <p className="text-sm text-muted-foreground">
          Connect your Stripe account to Helicone using a Restricted Access Key
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="stripeIntegration"
          checked={integration?.active ?? false}
          onCheckedChange={() =>
            updateIntegration({
              autoDatasetSync: false,
              active: !integration?.active,
              event_name: eventName,
              showNotification: false,
            })
          }
          disabled={isLoading}
          className="data-[state=checked]:bg-green-500"
        />
        <Label htmlFor="stripeIntegration">Enable Stripe Integration</Label>
      </div>

      <div className="space-y-4 rounded-lg border border-border bg-muted/50 p-4">
        <h3 className="text-sm font-medium">
          How to get your Stripe Restricted Access Key
        </h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <ol className="list-inside list-decimal space-y-2">
            <li>
              Go to your Stripe Dashboard and navigate to{" "}
              <span className="font-medium text-foreground">
                Developers → API keys
              </span>
            </li>
            <li>
              Click{" "}
              <span className="font-medium text-foreground">
                Create restricted key
              </span>
            </li>
            <li>
              Give your key a descriptive name like &quot;Helicone
              Integration&quot;
            </li>
            <li>
              Set the following permissions:
              <ul className="ml-6 mt-1 list-inside list-disc space-y-1">
                <li>
                  <span className="font-medium text-foreground">Billing</span>:
                  Write access (required for meter events)
                </li>
                <li>
                  <span className="font-medium text-foreground">
                    Meter events
                  </span>
                  : Write access
                </li>
                <li>
                  <span className="font-medium text-foreground">Customers</span>
                  : Read access (optional, for validation)
                </li>
              </ul>
            </li>
            <li>
              Click{" "}
              <span className="font-medium text-foreground">Create key</span>
            </li>
            <li>
              Copy the key (it starts with &quot;rk_live_&quot; or
              &quot;rk_test_&quot;) and paste it below
            </li>
          </ol>
          <p className="mt-3 text-xs">
            <span className="font-medium text-foreground">Note:</span> Use a
            test key (rk_test_) for development and a live key (rk_live_) for
            production.
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-medium">Meter Settings</h3>

        <div className="space-y-2">
          <Label htmlFor="eventName">Event Name</Label>
          <Input
            id="eventName"
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="helicone_request"
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            The event name to use when sending data to Stripe
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-dashed border-muted-foreground/50 bg-muted/30 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">Test Meter Events</h3>
            <p className="text-xs text-muted-foreground">
              Test your meter event configuration without saving
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="testCustomerId">Stripe Customer ID</Label>
          <div className="flex gap-2">
            <Input
              id="testCustomerId"
              type="text"
              value={testCustomerId}
              onChange={(e) => setTestCustomerId(e.target.value)}
              placeholder="cus_12345678"
              disabled={isLoading}
            />
            <Button
              variant="outline"
              onClick={handleTestMeterEvent}
              disabled={
                isLoading ||
                !eventName ||
                !testCustomerId ||
                testMeterEvent.isPending
              }
            >
              {testMeterEvent.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Test Event
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            This will send a test meter event to Stripe using your current
            settings
          </p>
        </div>

        {testResult && (
          <div
            className={`rounded-md border p-3 text-sm ${
              testResult.type === "success"
                ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
                : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
            }`}
          >
            <div className="flex items-start gap-2">
              <div
                className={`mt-0.5 h-2 w-2 rounded-full ${
                  testResult.type === "success" ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <div className="flex-1">
                <p className="font-medium">
                  {testResult.type === "success"
                    ? "Test Successful"
                    : "Test Failed"}
                </p>
                <p className="mt-1 text-xs opacity-90">{testResult.message}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="stripeKey">Stripe Restricted Access Key (RAK)</Label>
        <div className="relative">
          <Input
            id="stripeKey"
            type={showApiKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="rk_live_..."
            disabled={isLoading}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2"
            onClick={() => setShowApiKey(!showApiKey)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : showApiKey ? (
              <EyeOffIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Your key is encrypted and stored securely
        </p>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || isLoading || !apiKey}
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save Configuration
        </Button>
      </div>
    </div>
  );
};

export default StripeConfig;
