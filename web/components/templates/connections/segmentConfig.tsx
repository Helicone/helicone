import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import { useSegmentKey } from "@/services/hooks/useSegmentKey";
import { useIntegration } from "@/services/hooks/useIntegrations";

interface SegmentConfigProps {
  onClose: () => void;
}

const getExampleEvent = () => {
  return {
    requestId: "00000000-0000-0000-0000-000000000000",
    event: "test-event",
    timestamp: new Date().toISOString(),
    latencyMs: 100,
    properties: {
      environment: "production",
    },
    userId: "1234567890",
    sessionId: "1234567890",
    heliconeUrl:
      "https://us.helicone.ai/requests?requestId=00000000-0000-0000-0000-000000000000",
  };
};

const SegmentConfig: React.FC<SegmentConfigProps> = ({ onClose }) => {
  const [apiKey, setApiKey] = useState("");
  const [autoDatasetSync, setAutoDatasetSync] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const { existingKey, isLoadingVault, saveKey, isSavingKey } = useSegmentKey();
  const {
    integration,
    isLoadingIntegration,
    updateIntegration,
    isUpdatingIntegration,
  } = useIntegration("segment");

  useEffect(() => {
    if (existingKey?.provider_key) setApiKey(existingKey.provider_key);
    if (integration?.settings?.autoDatasetSync !== undefined) {
      setAutoDatasetSync(integration.settings?.autoDatasetSync as boolean);
    }
  }, [existingKey, integration]);

  const handleAutoDatasetSyncChange = (checked: boolean) => {
    setAutoDatasetSync(checked);
  };

  const isSaving = isSavingKey || isUpdatingIntegration;
  const isLoading = isLoadingVault || isLoadingIntegration;

  const [testEventResponse, setTestEventResponse] = useState<string | null>(
    null
  );

  const handleTestEvent = () => {
    fetch("https://api.segment.io/v1/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        writeKey: apiKey,
        ...getExampleEvent(),
      }),
    })
      .then((res) => res.json())
      .then((data) => setTestEventResponse(JSON.stringify(data)));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Switch
          id="autoDatasetSync"
          checked={integration?.active ?? false}
          onCheckedChange={() =>
            updateIntegration({
              autoDatasetSync,
              active: !integration?.active,
            })
          }
          disabled={isLoading}
          className="data-[state=checked]:bg-green-500"
        />
        <Label htmlFor="autoDatasetSync">Enable Segment Integration</Label>
      </div>
      <div className="space-y-2">
        <Label htmlFor="segmentKey">Segment API Key</Label>
        <div className="relative">
          <Input
            id="segmentKey"
            type={showApiKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Segment API key"
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
      </div>
      <div className="flex space-x-2">
        <Button variant="outline" onClick={handleTestEvent}>
          Test event
        </Button>
        <Button onClick={onClose} disabled={isSaving || isLoading}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save Configuration
        </Button>
      </div>
      {testEventResponse && <div>{testEventResponse}</div>}
    </div>
  );
};

export default SegmentConfig;
