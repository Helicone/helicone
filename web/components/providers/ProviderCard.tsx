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
  // Use our custom hook to manage all provider functionality
  const {
    existingKey,
    apiKey,
    isSavingKey,
    isSavedKey,
    setApiKey,
    handleSaveKey,
    viewDecryptedProviderKey,
    refetchProviderKeys,
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
    if (!existingKey || !viewDecryptedProviderKey) return;

    // If already viewing, hide the key
    if (keyDisplayState === "viewing") {
      setKeyDisplayState("hidden");
      return;
    }

    // If we have the key cached, show it
    if (decryptedKey) {
      setKeyDisplayState("viewing");
      return;
    }

    // Otherwise, load the key
    try {
      setKeyDisplayState("loading");
      const key = await viewDecryptedProviderKey(existingKey.id);

      if (key) {
        setDecryptedKey(key);
        setKeyDisplayState("viewing");
      } else {
        setKeyDisplayState("hidden");
        setNotification("Couldn't retrieve the key", "error");
      }
    } catch (error) {
      setKeyDisplayState("hidden");
      setNotification("Error fetching key", "error");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => setNotification("API key copied to clipboard", "success"))
      .catch(() => setNotification("Failed to copy to clipboard", "error"));
  };

  // Handle saving with proper query invalidation
  const handleSaveAndRefresh = async () => {
    if (!handleSaveKey) return;

    try {
      await handleSaveKey();

      // Clear the decrypted key and states since it might have changed
      setDecryptedKey(null);
      setKeyDisplayState("hidden");

      // Refetch to ensure our data is fresh
      if (refetchProviderKeys) {
        await refetchProviderKeys();
      }
    } catch (error) {
      setNotification("Failed to save key", "error");
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
                  // If viewing decrypted key, changing input exits view mode
                  if (isViewingKey) {
                    setKeyDisplayState("hidden");
                    setApiKey(e.target.value);
                  } else {
                    setApiKey(e.target.value);
                  }
                }}
                className="flex-1 text-sm h-8 py-1"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              {isEditMode && viewDecryptedProviderKey && (
                <>
                  {isViewingKey && (
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
                </>
              )}

              <Button
                onClick={handleSaveAndRefresh}
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
