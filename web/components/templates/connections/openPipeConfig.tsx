import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import { useOpenPipeKey } from "@/services/hooks/useOpenPipeKey";
import { useIntegration } from "@/services/hooks/useIntegrations";

interface OpenPipeConfigProps {
  onClose: () => void;
}

const OpenPipeConfig: React.FC<OpenPipeConfigProps> = ({ onClose }) => {
  const [apiKey, setApiKey] = useState("");
  const [autoDatasetSync, setAutoDatasetSync] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const [openPipeIntegrationEnabled, setOpenPipeIntegrationEnabled] =
    useState(false);

  const { existingKey, isLoadingVault, saveKey, isSavingKey } =
    useOpenPipeKey();
  const {
    integration,
    isLoadingIntegration,
    updateIntegration,
    isUpdatingIntegration,
  } = useIntegration("open_pipe");

  useEffect(() => {
    if (existingKey?.provider_key) setApiKey(existingKey.provider_key);
    if (integration?.settings?.autoDatasetSync !== undefined) {
      setAutoDatasetSync(integration.settings?.autoDatasetSync as boolean);
    }
    if (integration?.active !== undefined) {
      setOpenPipeIntegrationEnabled(integration.active as boolean);
    }
  }, [existingKey, integration]);

  const handleSave = () => {
    saveKey(apiKey);
    updateIntegration({ autoDatasetSync, active: openPipeIntegrationEnabled });
    onClose();
  };

  const handleAutoDatasetSyncChange = (checked: boolean) => {
    setAutoDatasetSync(checked);
  };

  const isSaving = isSavingKey || isUpdatingIntegration;
  const isLoading = isLoadingVault || isLoadingIntegration;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Switch
          id="autoDatasetSync"
          checked={openPipeIntegrationEnabled}
          onCheckedChange={() =>
            setOpenPipeIntegrationEnabled(!openPipeIntegrationEnabled)
          }
          disabled={isLoading}
          className="data-[state=checked]:bg-green-500"
        />
        <Label htmlFor="autoDatasetSync">Enable OpenPipe Integration</Label>
      </div>
      <div className="space-y-2">
        <Label htmlFor="openPipeKey">OpenPipe API Key</Label>
        <div className="relative">
          <Input
            id="openPipeKey"
            type={showApiKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your OpenPipe API key"
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
      <div className="flex items-center space-x-2">
        <Switch
          id="autoDatasetSync"
          checked={false && autoDatasetSync}
          onCheckedChange={handleAutoDatasetSyncChange}
          disabled={true || isLoading}
        />
        <Label htmlFor="autoDatasetSync">Enable Auto Dataset Syncing</Label>
        <i className="text-muted-foreground text-xs opacity-50">
          {" "}
          comming soon
        </i>
      </div>

      <Button onClick={handleSave} disabled={isSaving || isLoading}>
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Save Configuration
      </Button>
    </div>
  );
};

export default OpenPipeConfig;
