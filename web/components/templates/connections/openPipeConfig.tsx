import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import { useJawnClient } from "../../../lib/clients/jawnHook";
import { useQuery, useMutation } from "@tanstack/react-query";
import useNotification from "../../shared/notification/useNotification";

const OPEN_PIPE_PROVIDER_NAME = "OPEN_PIPE";

interface OpenPipeConfigProps {
  onClose: () => void;
}

const OpenPipeConfig: React.FC<OpenPipeConfigProps> = ({ onClose }) => {
  const [apiKey, setApiKey] = useState("");
  const [autoDatasetSync, setAutoDatasetSync] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const jawnClient = useJawnClient();
  const { setNotification } = useNotification();

  const { data: existingKey, isLoading: isLoadingVault } = useQuery({
    queryKey: ["openPipeKey"],
    queryFn: async () => {
      const response = await jawnClient.GET("/v1/vault/keys");
      if (response.data?.error) throw new Error(response.data.error);
      return response.data?.data?.find(
        (key) => key.provider_name === OPEN_PIPE_PROVIDER_NAME
      );
    },
  });

  useEffect(() => {
    if (existingKey?.provider_key) setApiKey(existingKey.provider_key);
  }, [existingKey]);

  const { mutate: saveKey, isLoading: isSaving } = useMutation({
    mutationFn: async (newKey: string) => {
      if (existingKey?.id) {
        // Update existing key
        return jawnClient.PATCH(`/v1/vault/update/{id}`, {
          params: {
            path: {
              id: existingKey.id,
            },
          },
          body: {
            key: newKey,
            name: "OpenPipe API Key",
          },
        });
      } else {
        // Add new key
        return jawnClient.POST("/v1/vault/add", {
          body: {
            key: newKey,
            provider: OPEN_PIPE_PROVIDER_NAME,
            name: "OpenPipe API Key",
          },
        });
      }
    },
    onSuccess: () => {
      setNotification("OpenPipe API key saved successfully", "success");
      onClose();
    },
    onError: (error) => {
      setNotification(`Failed to save OpenPipe API key: ${error}`, "error");
    },
  });

  const handleSave = () => saveKey(apiKey);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="openPipeKey">OpenPipe API Key</Label>
        <div className="relative">
          <Input
            id="openPipeKey"
            type={showApiKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your OpenPipe API key"
            disabled={isLoadingVault}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2"
            onClick={() => setShowApiKey(!showApiKey)}
            disabled={isLoadingVault}
          >
            {isLoadingVault ? (
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
          checked={autoDatasetSync}
          onCheckedChange={setAutoDatasetSync}
        />
        <Label htmlFor="autoDatasetSync">Enable Auto Dataset Syncing</Label>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Datasets</h3>
        <p className="text-sm text-muted-foreground">
          Dataset list and fine-tuning options will be displayed here.
        </p>
      </div>
      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Save Configuration
      </Button>
    </div>
  );
};

export default OpenPipeConfig;
