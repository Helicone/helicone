import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import { useStripeKey } from "@/services/hooks/useStripeKey";
import { useIntegration } from "@/services/hooks/useIntegrations";

interface StripeConfigProps {
  onClose: () => void;
}

const StripeConfig: React.FC<StripeConfigProps> = ({ onClose }) => {
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  const { existingKey, isLoadingVault, saveKey, isSavingKey } = useStripeKey();
  const {
    integration,
    isLoadingIntegration,
    updateIntegration,
    isUpdatingIntegration,
  } = useIntegration("stripe");

  useEffect(() => {
    if (existingKey?.provider_key) setApiKey(existingKey.provider_key);
  }, [existingKey, integration]);

  const isSaving = isSavingKey || isUpdatingIntegration;
  const isLoading = isLoadingVault || isLoadingIntegration;

  const handleSave = async () => {
    try {
      await saveKey(apiKey);

      // Enable integration if not already active
      if (!integration?.active) {
        updateIntegration({
          autoDatasetSync: false,
          active: true,
        });
      }

      onClose();
    } catch (error) {
      // Error notifications are already handled in the hooks
      console.error("Failed to save Stripe configuration:", error);
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
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Instructions for obtaining your Stripe RAK will be added here.</p>
        </div>
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
