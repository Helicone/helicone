import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Copy, Eye, EyeOff, Plus, Save } from "lucide-react";
import { Provider } from "@/types/provider";
import { useProvider } from "@/hooks/useProvider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useNotification from "@/components/shared/notification/useNotification";

interface ProviderCardProps {
  provider: Provider;
}

// A simpler key display state enum
type KeyDisplayState = "hidden" | "viewing" | "loading";

export const ProviderCard: React.FC<ProviderCardProps> = ({ provider }) => {
  const [apiKey, setApiKey] = useState("");
  const {
    existingKey,
    isSavingKey,
    isSavedKey,
    addProviderKey,
    updateProviderKey,
    isLoadingKeys,
    providerKeys,
    viewDecryptedProviderKey,
  } = useProvider({ provider });

  // Simplified state management
  const [keyDisplayState, setKeyDisplayState] =
    useState<KeyDisplayState>("hidden");
  const [decryptedKey, setDecryptedKey] = useState<string | null>(null);
  const { setNotification } = useNotification();

  // Reset decrypted key view when saving or after successful save
  useEffect(() => {
    if (isSavingKey || isSavedKey) {
      setKeyDisplayState("hidden");
      setDecryptedKey(null);
    }
  }, [isSavingKey, isSavedKey]);

  // Handle toggling key visibility with a simplified approach
  const toggleKeyVisibility = async () => {
    // If already viewing, hide the key in both cases
    if (keyDisplayState === "viewing") {
      setKeyDisplayState("hidden");
      setDecryptedKey(null);
      return;
    }

    // If we have an existing key, fetch the decrypted version
    if (existingKey) {
      // Set loading state
      setKeyDisplayState("loading");

      try {
        // Fetch the decrypted key
        const key = await viewDecryptedProviderKey(existingKey.id);

        if (key) {
          setDecryptedKey(key);
          setKeyDisplayState("viewing");
        } else {
          setNotification("Failed to retrieve key", "error");
          setKeyDisplayState("hidden");
        }
      } catch (error) {
        console.error("Error viewing key:", error);
        setNotification("Failed to retrieve key", "error");
        setKeyDisplayState("hidden");
      }
    } else {
      // For new key entry, just toggle the visibility
      setKeyDisplayState("viewing");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => setNotification("API key copied to clipboard", "success"))
      .catch(() => setNotification("Failed to copy to clipboard", "error"));
  };

  // Handle saving or updating the key
  const handleSaveKey = async () => {
    try {
      if (isEditMode) {
        if (!existingKey) return;
        // If we have an existing key, use updateProviderKey mutation
        updateProviderKey.mutate({
          providerName: provider.name,
          key: apiKey,
          keyId: existingKey.id,
          providerKeyName: `${provider.name} API Key`,
        });
      } else {
        // Otherwise create a new key using addProviderKey mutation
        addProviderKey.mutate({
          providerName: provider.name,
          key: apiKey,
          providerKeyName: `${provider.name} API Key`,
        });
      }
    } catch (error) {
      console.error("Error saving provider key:", error);
      setNotification("Failed to save provider key", "error");
    }
  };

  const isViewingKey = keyDisplayState === "viewing";
  const isEditMode = !!existingKey;

  return (
    <div className="border rounded-md overflow-hidden bg-card hover:border-primary/40 transition-colors">
      <div className="px-3 py-2">
        <div className="flex flex-col gap-1.5">
          {/* Provider info and key status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 flex items-center justify-center bg-muted rounded-md overflow-hidden">
                <img
                  src={provider.logoUrl}
                  alt={`${provider.name} logo`}
                  className="h-4 w-4 object-contain"
                  onError={(e) => {
                    e.currentTarget.src =
                      "/assets/home/providers/anthropic.png";
                  }}
                />
              </div>
              <div className="font-medium text-sm">{provider.name}</div>
              {isEditMode && (
                <div className="text-xs text-muted-foreground border border-muted-foreground/30 rounded px-1.5 py-0.5">
                  Key set
                </div>
              )}
            </div>

            {isViewingKey && (
              <div className="text-xs text-blue-500">Showing key</div>
            )}
          </div>

          {/* Key input row */}
          <div className="flex gap-1 items-center">
            <div className="relative flex-1">
              <Input
                type={isViewingKey ? "text" : "password"}
                placeholder={
                  isEditMode ? "••••••••••••••••" : provider.apiKeyPlaceholder
                }
                value={isViewingKey && decryptedKey ? decryptedKey : apiKey}
                onChange={(e) => {
                  // Allow editing the input regardless of view mode
                  setApiKey(e.target.value);

                  // If we're viewing a decrypted key and editing, reset to the new value
                  if (isViewingKey && decryptedKey) {
                    setDecryptedKey(null);
                  }
                }}
                className="flex-1 text-sm h-8 py-1"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              {/* Show copy button only when viewing an existing decrypted key */}
              {isViewingKey && decryptedKey && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(decryptedKey || "")}
                        className="h-8 w-8 text-blue-500"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Show eye toggle for both new and existing keys */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={toggleKeyVisibility}
                      className="h-8 w-8 text-blue-500"
                      disabled={keyDisplayState === "loading"}
                    >
                      {keyDisplayState === "loading" ? (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-transparent border-current" />
                      ) : isViewingKey ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isViewingKey ? "Hide" : "View"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button
                onClick={handleSaveKey}
                disabled={(!apiKey && !isEditMode) || isSavingKey}
                size="sm"
                className="flex items-center gap-1 whitespace-nowrap h-8 px-3"
              >
                {isSavingKey ? (
                  "Saving..."
                ) : isSavedKey ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Saved
                  </>
                ) : isEditMode ? (
                  <>
                    <Save className="h-3.5 w-3.5" /> Update
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" /> Add
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
