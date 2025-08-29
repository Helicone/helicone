import React, { useEffect, useState } from "react";
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
  Trash2,
  Pencil,
} from "lucide-react";
import { Provider, ProviderKey } from "@/types/provider";
import { useProvider } from "@/hooks/useProvider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useNotification from "@/components/shared/notification/useNotification";
import { Muted, Small } from "@/components/ui/typography";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/telemetry/logger";

// ====== Types ======
interface ProviderCardProps {
  provider: Provider;
}

interface ProviderInstanceProps {
  provider: Provider;
  existingKey?: ProviderKey;
  onRemove?: () => void;
  isMultipleMode?: boolean;
  instanceIndex?: number;
  onSaveSuccess?: () => void;
}

// ====== Provider Instance Component ======
const ProviderInstance: React.FC<ProviderInstanceProps> = ({
  provider,
  existingKey,
  onRemove,
  isMultipleMode = false,
  instanceIndex = 0,
  onSaveSuccess,
}) => {
  const { setNotification } = useNotification();
  const {
    isSavingKey,
    addProviderKey,
    updateProviderKey,
    viewDecryptedProviderKey,
  } = useProvider({ provider });

  // Track saved state locally to control when to show "Saved" vs "Update"
  const [isSavedLocal, setIsSavedLocal] = useState(false);

  // ====== State Management with useState ======
  const [keyValue, setKeyValue] = useState("");
  const [secretKeyValue, setSecretKeyValue] = useState("");
  const [keyName, setKeyName] = useState("");
  const [isViewingKey, setIsViewingKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [decryptedKey, setDecryptedKey] = useState<string | null>(null);
  const [decryptedSecretKey, setDecryptedSecretKey] = useState<string | null>(
    null,
  );
  const [configVisible, setConfigVisible] = useState(false);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [byokEnabled, setByokEnabled] = useState(false);

  // Ref for the name input to programmatically focus it
  const nameInputRef = React.useRef<HTMLInputElement>(null);

  // ====== Derived state ======
  const isEditMode = !!existingKey;
  const hasAdvancedConfig =
    provider.id === "azure" ||
    provider.id === "aws" ||
    provider.id === "vertex";

  // Track if there are unsaved changes
  const hasUnsavedChanges =
    isEditMode &&
    (keyValue !== "" ||
      secretKeyValue !== "" ||
      byokEnabled !== (existingKey?.byok_enabled || false));

  // Generate default name for new instances
  const defaultKeyName =
    isMultipleMode && !existingKey
      ? `${provider.name} API Key ${instanceIndex + 1}`
      : `${provider.name} API Key`;

  // Display name for the instance
  const displayName = isMultipleMode
    ? isEditMode
      ? existingKey?.provider_key_name || `Instance ${instanceIndex + 1}`
      : keyName || defaultKeyName
    : provider.name;

  // ====== Initialize config values and key name ======
  useEffect(() => {
    // Initialize default config based on provider
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
        crossRegion: "false",
      };
    } else if (provider.id === "vertex") {
      initialConfig = {
        region: "",
        projectId: "",
      };
    }

    // Override with existing config if available
    if (existingKey?.config) {
      try {
        setConfigValues({
          ...initialConfig,
          ...(existingKey.config as Record<string, string>),
        });
      } catch (error) {
        logger.error({ error, existingKey }, "Error parsing config");
        setConfigValues(initialConfig);
      }
    } else {
      setConfigValues(initialConfig);
    }

    // Initialize byokEnabled from existing key
    if (existingKey?.byok_enabled !== undefined) {
      setByokEnabled(existingKey.byok_enabled);
    }

    // Initialize key name for new instances
    if (!existingKey && isMultipleMode) {
      setKeyName(defaultKeyName);
    }
  }, [existingKey, provider.id, defaultKeyName, isMultipleMode]);

  // Reset key view when saving or after successful save
  useEffect(() => {
    if (isSavingKey) {
      setIsViewingKey(false);
      setDecryptedKey(null);
      setDecryptedSecretKey(null);
    }

    // Set local saved state when save completes
    if (addProviderKey.isSuccess || updateProviderKey.isSuccess) {
      setIsSavedLocal(true);

      // Notify parent when save is successful (for new instances)
      if (!existingKey && onSaveSuccess) {
        onSaveSuccess();
      }
    }
  }, [
    isSavingKey,
    addProviderKey.isSuccess,
    updateProviderKey.isSuccess,
    existingKey,
    onSaveSuccess,
  ]);

  // Reset saved state when any changes are made
  useEffect(() => {
    if (hasUnsavedChanges) {
      setIsSavedLocal(false);
    }
  }, [hasUnsavedChanges]);

  // ====== Event handlers ======
  const handleToggleKeyVisibility = async () => {
    if (isViewingKey) {
      setIsViewingKey(false);
      setDecryptedKey(null);
      setDecryptedSecretKey(null);
      return;
    }

    // For existing keys, fetch the decrypted version
    if (existingKey) {
      setIsLoading(true);

      try {
        const key = (await viewDecryptedProviderKey(existingKey.id)) ?? {
          providerKey: "",
          providerSecretKey: null,
        };
        setDecryptedKey(key.providerKey);
        setDecryptedSecretKey(key.providerSecretKey || null);
        setIsViewingKey(true);
      } catch (error) {
        logger.error({ error, keyId: existingKey.id }, "Error viewing key");
        setNotification("Failed to retrieve key", "error");
      } finally {
        setIsLoading(false);
      }
    } else {
      // For new keys, just toggle visibility
      setIsViewingKey(true);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => setNotification("API key copied to clipboard", "success"))
      .catch(() => setNotification("Failed to copy to clipboard", "error"));
  };

  const handleUpdateConfigField = (key: string, value: string) => {
    setConfigValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handlePencilClick = () => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  };

  const handleSaveKey = async () => {
    try {
      if (isEditMode) {
        if (!existingKey) return;
        // If we have an existing key, use updateProviderKey mutation
        updateProviderKey.mutate({
          key: keyValue,
          secretKey: secretKeyValue,
          keyId: existingKey.id,
          config: configValues,
          byokEnabled,
        });
      } else {
        // Otherwise create a new key using addProviderKey mutation
        addProviderKey.mutate({
          providerName: provider.id,
          key: keyValue,
          secretKey: secretKeyValue,
          providerKeyName: keyName || defaultKeyName,
          config: configValues,
          byokEnabled,
        });
      }
    } catch (error) {
      logger.error(
        { error, providerName: provider.name, isEditMode },
        "Error saving provider key",
      );
      setNotification("Failed to save provider key", "error");
    }
  };

  // ====== Handle input value changes ======
  const handleKeyValueChange = (value: string) => {
    setKeyValue(value);
    // If we're editing while viewing a decrypted key, stop showing it
    if (isViewingKey && decryptedKey) {
      setIsViewingKey(false);
      setDecryptedKey(null);
      setDecryptedSecretKey(null);
    }
  };

  // ====== Render methods ======
  const renderConfigFields = () => {
    if (!hasAdvancedConfig) return null;

    // Configuration fields based on provider
    let configFields: {
      label: string;
      key: string;
      placeholder: string;
      type?: string;
    }[] = [];

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
          label: "Cross Region",
          key: "crossRegion",
          placeholder: "false",
          type: "boolean",
        },
      ];
    } else if (provider.id === "vertex") {
      configFields = [
        { label: "Region", key: "region", placeholder: "us-east5" },
        {
          label: "Project ID",
          key: "projectId",
          placeholder: "your-project-id",
        },
      ];
    }

    return (
      <div className="mt-3 flex flex-col gap-2 border-t pt-3">
        <Small className="font-medium">Advanced Configuration</Small>
        <Muted>Required fields for this provider</Muted>

        <div className="mt-2 flex flex-col gap-3">
          {configFields.map((field) => (
            <div
              key={field.key}
              className={cn(
                "flex gap-1",
                field.type === "boolean"
                  ? "flex-row items-center gap-2"
                  : "flex-col",
              )}
            >
              <Small className="text-xs">{field.label}</Small>
              {field.type === "boolean" ? (
                <Checkbox
                  checked={configValues[field.key] === "true"}
                  onCheckedChange={(checked) =>
                    handleUpdateConfigField(
                      field.key,
                      checked ? "true" : "false",
                    )
                  }
                />
              ) : (
                <Input
                  type={field.type ?? "text"}
                  placeholder={field.placeholder}
                  value={configValues[field.key] || ""}
                  onChange={(e) =>
                    handleUpdateConfigField(field.key, e.target.value)
                  }
                  className="h-7 text-xs"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "bg-background transition-colors",
        isMultipleMode
          ? "border-l-2 border-l-muted-foreground/20 pl-3"
          : "border-b border-border last:border-b-0 hover:bg-muted/50",
      )}
    >
      <div className={cn("p-3", isMultipleMode && "py-2")}>
        <div className="flex flex-col gap-1.5">
          {/* Provider info and key status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!isMultipleMode && (
                <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-md bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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
              )}
              {isMultipleMode && !isEditMode ? (
                <div className="group flex items-center gap-1">
                  <Input
                    ref={nameInputRef}
                    type="text"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder={defaultKeyName}
                    className="h-6 w-32 border-0 bg-transparent p-0 text-xs font-medium focus:border focus:bg-background focus:px-2 group-hover:bg-muted/50"
                  />
                  <Pencil
                    className="h-3 w-3 cursor-pointer text-muted-foreground opacity-70 group-hover:opacity-100"
                    onClick={handlePencilClick}
                  />
                </div>
              ) : (
                <div className="text-xs font-medium">{displayName}</div>
              )}
              {!isMultipleMode && provider.note && (
                <div className="text-[10px] text-muted-foreground">
                  {provider.note}
                </div>
              )}
              {isEditMode && (
                <div className="flex items-center gap-1">
                  <div className="border border-muted-foreground/30 px-1 py-0.5 text-xs text-muted-foreground">
                    Key set
                  </div>
                  {existingKey?.cuid && (
                    <div className="font-mono text-[10px] text-muted-foreground/60">
                      {existingKey.cuid}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isViewingKey && (
                <div className="text-xs text-blue-500">Showing key</div>
              )}
              {isMultipleMode && onRemove && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={onRemove}
                        className="h-6 w-6 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remove instance</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>

          {/* Key input row */}
          <div className="flex items-end gap-1">
            <div className="relative flex-1">
              {provider.id === "aws" && <Label>Access key</Label>}
              <Input
                type={isViewingKey ? "text" : "password"}
                placeholder={
                  isEditMode ? "••••••••••••••••" : provider.apiKeyPlaceholder
                }
                value={isViewingKey && decryptedKey ? decryptedKey : keyValue}
                onChange={(e) => handleKeyValueChange(e.target.value)}
                className="h-7 flex-1 py-1 text-xs"
              />
            </div>
            {provider.id === "aws" && (
              <div className="relative flex-1">
                <Label>Secret key</Label>
                <Input
                  type={isViewingKey ? "text" : "password"}
                  placeholder={isEditMode ? "••••••••••••••••" : "..."}
                  value={
                    isViewingKey && decryptedSecretKey
                      ? decryptedSecretKey
                      : secretKeyValue
                  }
                  onChange={(e) => setSecretKeyValue(e.target.value)}
                  className="h-7 flex-1 py-1 text-xs"
                />
              </div>
            )}

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
                        onClick={() =>
                          handleCopyToClipboard(decryptedKey || "")
                        }
                        className="h-7 w-7 text-blue-500"
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
                      className="h-7 w-7 text-blue-500"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
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
                disabled={
                  (!keyValue && !isEditMode && !hasUnsavedChanges) ||
                  isSavingKey
                }
                size="sm"
                className="flex h-7 items-center gap-1 whitespace-nowrap px-2 text-xs"
              >
                {isSavingKey ? (
                  "Saving..."
                ) : isSavedLocal && !hasUnsavedChanges ? (
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

          {/* BYOK toggle */}
          <div className="mt-2 flex items-center gap-2">
            <Checkbox
              id={`byok-${existingKey?.id || instanceIndex}`}
              checked={byokEnabled}
              onCheckedChange={(checked) => setByokEnabled(!!checked)}
            />
            <Label
              htmlFor={`byok-${existingKey?.id || instanceIndex}`}
              className="cursor-pointer text-xs font-normal"
            >
              Enable for AI Gateway (BYOK)
            </Label>
          </div>

          {/* Advanced config toggle */}
          {hasAdvancedConfig && (
            <div className="mt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfigVisible(!configVisible)}
                className="flex h-6 items-center gap-1 px-2 text-xs text-muted-foreground"
              >
                {configVisible ? (
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
              {configVisible && renderConfigFields()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ====== Main Provider Card Component ======
export const ProviderCard: React.FC<ProviderCardProps> = ({ provider }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasUnsavedForm, setHasUnsavedForm] = useState(false);
  const { providerKeys } = useProvider({ provider });

  // Filter provider keys for this specific provider
  const existingKeys = providerKeys.filter(
    (key) => key.provider_name === provider.id && !key.soft_delete,
  );

  // If provider doesn't allow multiple instances, use the original behavior
  if (!provider.multipleAllowed) {
    return (
      <ProviderInstance provider={provider} existingKey={existingKeys[0]} />
    );
  }

  // For providers that allow multiple instances
  const handleAddInstance = () => {
    setIsExpanded(true);
    setHasUnsavedForm(true);
  };

  const handleRemoveInstance = (_keyId: string) => {
    // TODO: Implement deletion logic
    // This would call a delete mutation from useProvider
  };

  return (
    <div className="border-b border-border bg-background transition-colors last:border-b-0">
      {/* Main header */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-md bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={provider.logoUrl}
                alt={`${provider.name} logo`}
                className="h-4 w-4 object-contain"
                onError={(e) => {
                  e.currentTarget.src = "/assets/home/providers/anthropic.png";
                }}
              />
            </div>
            <div className="text-xs font-medium">{provider.name}</div>
            {provider.note && (
              <div className="text-[10px] text-muted-foreground">
                {provider.note}
              </div>
            )}
            {existingKeys.length > 0 && (
              <div className="border border-muted-foreground/30 px-1 py-0.5 text-xs text-muted-foreground">
                {existingKeys.length} key{existingKeys.length > 1 ? "s" : ""}{" "}
                set
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Add new instance button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleAddInstance}
                    disabled={hasUnsavedForm}
                    className="h-7 w-7 text-blue-500 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {hasUnsavedForm
                    ? "Save current form first"
                    : "Add new instance"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Expand/collapse button */}
            {existingKeys.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-7 w-7 text-muted-foreground"
              >
                {isExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded content - accordion */}
      {isExpanded && (
        <div className="border-t border-border/50 bg-muted/20">
          <div className="space-y-3 p-2">
            {/* Existing instances */}
            {existingKeys.map((key, index) => (
              <ProviderInstance
                key={key.id}
                provider={provider}
                existingKey={key}
                onRemove={() => handleRemoveInstance(key.id)}
                isMultipleMode={true}
                instanceIndex={index}
              />
            ))}

            {/* New instance form - only show when hasUnsavedForm is true */}
            {hasUnsavedForm && (
              <div className="border-t border-border/30 pt-3">
                <div className="mb-2 text-xs text-muted-foreground">
                  Add new instance:
                </div>
                <ProviderInstance
                  provider={provider}
                  isMultipleMode={true}
                  instanceIndex={existingKeys.length}
                  onRemove={() => setHasUnsavedForm(false)}
                  onSaveSuccess={() => setHasUnsavedForm(false)}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
