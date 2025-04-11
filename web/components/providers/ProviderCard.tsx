import React, { useReducer, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Save,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Provider } from "@/types/provider";
import { useProvider } from "@/hooks/useProvider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useNotification from "@/components/shared/notification/useNotification";
import { Muted, Small } from "@/components/ui/typography";

// ====== Types ======
interface ProviderCardProps {
  provider: Provider;
}

// Define our state structure
interface ProviderCardState {
  key: {
    value: string;
    displayState: "hidden" | "viewing" | "loading";
    decryptedValue: string | null;
  };
  config: {
    isVisible: boolean;
    values: Record<string, string>;
  };
}

// Define action types
type ProviderCardAction =
  | { type: "SET_KEY_VALUE"; payload: string }
  | { type: "TOGGLE_KEY_VISIBILITY" }
  | { type: "SET_KEY_LOADING" }
  | { type: "SET_DECRYPTED_KEY"; payload: string }
  | { type: "HIDE_KEY" }
  | { type: "TOGGLE_CONFIG_VISIBILITY" }
  | { type: "UPDATE_CONFIG_FIELD"; payload: { key: string; value: string } }
  | { type: "INITIALIZE_CONFIG"; payload: Record<string, string> }
  | { type: "RESET_VIEW" };

// ====== Component ======
export const ProviderCard: React.FC<ProviderCardProps> = ({ provider }) => {
  const { setNotification } = useNotification();
  const {
    existingKey,
    isSavingKey,
    isSavedKey,
    addProviderKey,
    updateProviderKey,
    viewDecryptedProviderKey,
  } = useProvider({ provider });

  // ====== Reducer ======
  const getInitialState = (): ProviderCardState => {
    // Initialize with empty defaults based on provider
    let initialConfig = {};
    if (provider.id === "azure") {
      initialConfig = {
        baseUri: "",
        apiVersion: "",
        deploymentName: "",
      };
    } else if (provider.id === "aws") {
      initialConfig = {
        region: "",
        accessKeyId: "",
        sessionToken: "",
      };
    }

    return {
      key: {
        value: "",
        displayState: "hidden",
        decryptedValue: null,
      },
      config: {
        isVisible: false,
        values: initialConfig,
      },
    };
  };

  const reducer = (
    state: ProviderCardState,
    action: ProviderCardAction
  ): ProviderCardState => {
    switch (action.type) {
      case "SET_KEY_VALUE":
        return {
          ...state,
          key: {
            ...state.key,
            value: action.payload,
            // If we're editing while viewing a decrypted key, stop showing it
            ...(state.key.displayState === "viewing" &&
              state.key.decryptedValue && {
                displayState: "hidden",
                decryptedValue: null,
              }),
          },
        };

      case "TOGGLE_KEY_VISIBILITY":
        // If already viewing, hide the key
        if (state.key.displayState === "viewing") {
          return {
            ...state,
            key: {
              ...state.key,
              displayState: "hidden",
              decryptedValue: null,
            },
          };
        }
        // Otherwise show the key (for new keys, just toggle visibility)
        return {
          ...state,
          key: {
            ...state.key,
            displayState: "viewing",
          },
        };

      case "SET_KEY_LOADING":
        return {
          ...state,
          key: {
            ...state.key,
            displayState: "loading",
          },
        };

      case "SET_DECRYPTED_KEY":
        return {
          ...state,
          key: {
            ...state.key,
            displayState: "viewing",
            decryptedValue: action.payload,
          },
        };

      case "HIDE_KEY":
        return {
          ...state,
          key: {
            ...state.key,
            displayState: "hidden",
            decryptedValue: null,
          },
        };

      case "TOGGLE_CONFIG_VISIBILITY":
        return {
          ...state,
          config: {
            ...state.config,
            isVisible: !state.config.isVisible,
          },
        };

      case "UPDATE_CONFIG_FIELD":
        return {
          ...state,
          config: {
            ...state.config,
            values: {
              ...state.config.values,
              [action.payload.key]: action.payload.value,
            },
          },
        };

      case "INITIALIZE_CONFIG":
        return {
          ...state,
          config: {
            ...state.config,
            values: action.payload,
          },
        };

      case "RESET_VIEW":
        return {
          ...state,
          key: {
            ...state.key,
            displayState: "hidden",
            decryptedValue: null,
          },
        };

      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(reducer, getInitialState());

  // ====== Derived state ======
  const isViewingKey = state.key.displayState === "viewing";
  const isEditMode = !!existingKey;
  const isLoadingKey = state.key.displayState === "loading";
  const hasAdvancedConfig = provider.id === "azure" || provider.id === "aws";

  // ====== Effects ======
  // Initialize config from existing key
  useEffect(() => {
    if (existingKey?.config) {
      try {
        dispatch({
          type: "INITIALIZE_CONFIG",
          payload: existingKey.config as Record<string, string>,
        });
      } catch (error) {
        console.error("Error parsing config:", error);
      }
    }
  }, [existingKey]);

  // Reset key view when saving or after successful save
  useEffect(() => {
    if (isSavingKey || isSavedKey) {
      dispatch({ type: "RESET_VIEW" });
    }
  }, [isSavingKey, isSavedKey]);

  // ====== Event handlers ======
  const handleToggleKeyVisibility = async () => {
    if (state.key.displayState === "viewing") {
      dispatch({ type: "HIDE_KEY" });
      return;
    }

    // For existing keys, fetch the decrypted version
    if (existingKey) {
      dispatch({ type: "SET_KEY_LOADING" });

      try {
        const key = await viewDecryptedProviderKey(existingKey.id);

        if (key) {
          dispatch({ type: "SET_DECRYPTED_KEY", payload: key });
        } else {
          setNotification("Failed to retrieve key", "error");
          dispatch({ type: "HIDE_KEY" });
        }
      } catch (error) {
        console.error("Error viewing key:", error);
        setNotification("Failed to retrieve key", "error");
        dispatch({ type: "HIDE_KEY" });
      }
    } else {
      // For new keys, just toggle visibility
      dispatch({ type: "TOGGLE_KEY_VISIBILITY" });
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => setNotification("API key copied to clipboard", "success"))
      .catch(() => setNotification("Failed to copy to clipboard", "error"));
  };

  const handleUpdateConfigField = (key: string, value: string) => {
    dispatch({
      type: "UPDATE_CONFIG_FIELD",
      payload: { key, value },
    });
  };

  const handleSaveKey = async () => {
    try {
      if (isEditMode) {
        if (!existingKey) return;
        // If we have an existing key, use updateProviderKey mutation
        updateProviderKey.mutate({
          providerName: provider.name,
          key: state.key.value,
          keyId: existingKey.id,
          providerKeyName: `${provider.name} API Key`,
          config: state.config.values,
        });
      } else {
        // Otherwise create a new key using addProviderKey mutation
        addProviderKey.mutate({
          providerName: provider.name,
          key: state.key.value,
          providerKeyName: `${provider.name} API Key`,
          config: state.config.values,
        });
      }
    } catch (error) {
      console.error("Error saving provider key:", error);
      setNotification("Failed to save provider key", "error");
    }
  };

  // ====== Render methods ======
  const renderConfigFields = () => {
    if (!hasAdvancedConfig) return null;

    // Configuration fields based on provider
    let configFields: { label: string; key: string; placeholder: string }[] =
      [];

    if (provider.id === "azure") {
      configFields = [
        {
          label: "Base URI",
          key: "baseUri",
          placeholder: "https://your-resource-name.openai.azure.com",
        },
        { label: "API Version", key: "apiVersion", placeholder: "2023-05-15" },
        {
          label: "Deployment Name",
          key: "deploymentName",
          placeholder: "gpt-35-turbo",
        },
      ];
    } else if (provider.id === "aws") {
      configFields = [
        { label: "Region", key: "region", placeholder: "us-west-2" },
        {
          label: "AWS Access Key ID",
          key: "accessKeyId",
          placeholder: "Access key",
        },
        {
          label: "AWS Session Token",
          key: "sessionToken",
          placeholder: "Session token (optional)",
        },
      ];
    }

    return (
      <div className="mt-3 border-t pt-3 flex flex-col gap-2">
        <Small className="font-medium">Advanced Configuration</Small>
        <Muted>Required fields for this provider</Muted>

        <div className="flex flex-col gap-3 mt-2">
          {configFields.map((field) => (
            <div key={field.key} className="flex flex-col gap-1">
              <Small className="text-xs">{field.label}</Small>
              <Input
                type="text"
                placeholder={field.placeholder}
                value={state.config.values[field.key] || ""}
                onChange={(e) =>
                  handleUpdateConfigField(field.key, e.target.value)
                }
                className="h-8 text-sm"
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

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
                value={
                  isViewingKey && state.key.decryptedValue
                    ? state.key.decryptedValue
                    : state.key.value
                }
                onChange={(e) =>
                  dispatch({ type: "SET_KEY_VALUE", payload: e.target.value })
                }
                className="flex-1 text-sm h-8 py-1"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              {/* Show copy button only when viewing an existing decrypted key */}
              {isViewingKey && state.key.decryptedValue && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleCopyToClipboard(state.key.decryptedValue || "")
                        }
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
                      onClick={handleToggleKeyVisibility}
                      className="h-8 w-8 text-blue-500"
                      disabled={isLoadingKey}
                    >
                      {isLoadingKey ? (
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
                disabled={(!state.key.value && !isEditMode) || isSavingKey}
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

          {/* Advanced config toggle */}
          {hasAdvancedConfig && (
            <div className="mt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => dispatch({ type: "TOGGLE_CONFIG_VISIBILITY" })}
                className="flex items-center gap-1 text-xs text-muted-foreground h-7 px-2"
              >
                {state.config.isVisible ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" /> Hide advanced settings
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" /> Show advanced
                    settings
                  </>
                )}
              </Button>

              {/* Render the config fields when expanded */}
              {state.config.isVisible && renderConfigFields()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
