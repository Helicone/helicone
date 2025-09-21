import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Provider, ProviderKey } from "@/types/provider";
import { useProvider } from "@/hooks/useProvider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useNotification from "@/components/shared/notification/useNotification";
import { Small } from "@/components/ui/typography";
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
    deleteProviderKey,
    isDeletingKey,
    viewDecryptedProviderKey,
  } = useProvider({ provider });

  // Track saved state locally to control when to show "Saved" vs "Update"
  const [isSavedLocal, setIsSavedLocal] = useState(false);

  // ====== State Management with useState ======
  const [keyValue, setKeyValue] = useState("");
  const [secretKeyValue, setSecretKeyValue] = useState("");
  const [keyName, setKeyName] = useState("");
  const [isViewingKey, setIsViewingKey] = useState(false);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [decryptedKey, setDecryptedKey] = useState<string | null>(null);
  const [decryptedSecretKey, setDecryptedSecretKey] = useState<string | null>(
    null,
  );
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [byokEnabled, setByokEnabled] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // Ref for the name input to programmatically focus it
  const nameInputRef = React.useRef<HTMLInputElement>(null);

  // ====== Derived state ======
  const isEditMode = !!existingKey;
  const hasAdvancedConfig =
    provider.id === "azure" ||
    provider.id === "bedrock" ||
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
    } else if (provider.id === "bedrock") {
      initialConfig = {
        region: "",
        crossRegion: "false",
      };
    } else if (provider.id === "vertex") {
      initialConfig = {
        region: "",
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

  const handleServiceAccountJsonChange = (value: string) => {
    setKeyValue(value);
  };

  const handleEnterEditMode = async () => {
    // Fetch the current key value first
    if (existingKey) {
      setIsLoading(true);
      try {
        const key = (await viewDecryptedProviderKey(existingKey.id)) ?? {
          providerKey: "",
          providerSecretKey: null,
        };
        // Set the current values in the input fields
        setKeyValue(key.providerKey || "");
        setSecretKeyValue(key.providerSecretKey || "");
        setIsEditingKey(true);
        setIsViewingKey(false); // Not in view mode, but in edit mode
        setDecryptedKey(null);
        setDecryptedSecretKey(null);
      } catch (error) {
        logger.error(
          { error, keyId: existingKey.id },
          "Error fetching key for edit",
        );
        setNotification("Failed to load key for editing", "error");
      } finally {
        setIsLoading(false);
      }
    } else {
      // For new keys, just enter edit mode
      setIsEditingKey(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingKey(false);
    setKeyValue("");
    setSecretKeyValue("");
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

  const enrichConfigForProvider = (config: Record<string, string>) => {
    const enrichedConfig = { ...config };

    // For Vertex, extract projectId from service account JSON
    if (provider.id === "vertex" && keyValue) {
      try {
        const serviceAccount = JSON.parse(keyValue);
        if (serviceAccount.project_id) {
          enrichedConfig.projectId = serviceAccount.project_id;
        }
      } catch (e) {
        // Invalid JSON, let it fail on the backend
      }
    }

    return enrichedConfig;
  };

  const handleSaveKey = async () => {
    // Show confirmation dialog for editing existing keys
    if (isEditMode && isEditingKey) {
      setShowSaveConfirm(true);
      return;
    }

    // For new keys, save directly without confirmation
    if (!isEditMode) {
      try {
        addProviderKey.mutate({
          providerName: provider.id,
          key: keyValue,
          secretKey: secretKeyValue,
          providerKeyName: keyName || defaultKeyName,
          config: enrichConfigForProvider(configValues),
          byokEnabled,
        });
      } catch (error) {
        logger.error(
          { error, providerName: provider.name },
          "Error saving provider key",
        );
        setNotification("Failed to save provider key", "error");
      }
    }
  };

  const handleConfirmSave = async () => {
    setShowSaveConfirm(false);

    if (!existingKey) return;

    // Only update if we're in edit mode and have new values
    if (
      !isEditingKey ||
      (provider.id === "bedrock" && !keyValue && !secretKeyValue) ||
      (provider.id !== "bedrock" && !keyValue)
    ) {
      setNotification("Please enter at least one key value", "error");
      return;
    }

    try {
      // Update the provider key
      updateProviderKey.mutate({
        key: keyValue || undefined, // Only send if there's a value
        secretKey: secretKeyValue || undefined,
        keyId: existingKey.id,
        config: enrichConfigForProvider(configValues),
        byokEnabled,
      });
      setIsEditingKey(false); // Exit edit mode after saving
    } catch (error) {
      logger.error(
        { error, providerName: provider.name },
        "Error updating provider key",
      );
      setNotification("Failed to update provider key", "error");
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
    } else if (provider.id === "bedrock") {
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
        {
          label: "Region",
          key: "region",
          placeholder: "us-central1, us-east1, europe-west4, etc.",
        },
      ];
    }

    return (
      <div className="mt-3 flex flex-col gap-2">
        {provider.id === "bedrock" ? (
          // Special layout for AWS Bedrock to put cross region below region
          <div className="flex flex-col gap-2">
            <div className="flex gap-3">
              <div className="flex flex-1 flex-col gap-1">
                <Small className="text-xs">Region</Small>
                <Input
                  type="text"
                  placeholder="us-west-2"
                  value={configValues.region || ""}
                  onChange={(e) =>
                    handleUpdateConfigField("region", e.target.value)
                  }
                  className="h-7 text-xs"
                  disabled={isEditMode && !isEditingKey}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`crossRegion-${existingKey?.id || instanceIndex}`}
                checked={configValues.crossRegion === "true"}
                onCheckedChange={(checked) =>
                  handleUpdateConfigField(
                    "crossRegion",
                    checked ? "true" : "false",
                  )
                }
                disabled={isEditMode && !isEditingKey}
              />
              <Label
                htmlFor={`crossRegion-${existingKey?.id || instanceIndex}`}
                className="cursor-pointer text-xs font-normal"
              >
                Cross Region
              </Label>
            </div>
          </div>
        ) : (
          // Default layout for other providers
          <div className="flex gap-3">
            {configFields.map((field) => (
              <div key={field.key} className="flex flex-1 flex-col gap-1">
                <Small className="text-xs">{field.label}</Small>
                <Input
                  type={field.type ?? "text"}
                  placeholder={field.placeholder}
                  value={configValues[field.key] || ""}
                  onChange={(e) =>
                    handleUpdateConfigField(field.key, e.target.value)
                  }
                  className="h-7 text-xs"
                  disabled={isEditMode && !isEditingKey}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "bg-background transition-colors",
        isMultipleMode ? "border-l-2 border-l-muted-foreground/20 pl-3" : "",
      )}
    >
      <div className={cn("", isMultipleMode && "py-2")}>
        <div className="flex flex-col gap-1.5">
          {/* Provider info and key status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
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
              ) : isMultipleMode ? (
                <div className="text-xs font-medium">
                  {existingKey?.provider_key_name ||
                    `Instance ${instanceIndex + 1}`}
                </div>
              ) : null}
              {isEditMode && existingKey?.cuid && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">
                    Key ID:
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyToClipboard(existingKey.cuid || "");
                          }}
                          className="group flex items-center gap-1 rounded px-1 py-0.5 hover:bg-muted"
                        >
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {existingKey.cuid}
                          </span>
                          <Copy className="h-2.5 w-2.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Copy Key ID</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>

            {/* Remove instance button for multiple mode - keeping at top right */}
            {isMultipleMode && onRemove && !isEditMode && (
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

          {/* Key input row */}
          <div className="flex items-end gap-1">
            <div className="relative flex-1">
              {provider.id === "bedrock" && <Label>Access key</Label>}
              {provider.auth === "service_account" && !isEditMode && (
                <div>
                  <Label>Service Account JSON</Label>
                  <Textarea
                    placeholder="Paste your service account JSON here..."
                    value={keyValue}
                    onChange={(e) =>
                      handleServiceAccountJsonChange(e.target.value)
                    }
                    className="font-mono min-h-[120px] resize-y text-xs"
                    disabled={isEditMode && !isEditingKey}
                  />
                  {keyValue && (
                    <Small className="mt-2 text-xs text-muted-foreground">
                      Service account loaded ✓
                    </Small>
                  )}
                  {!keyValue && (
                    <Small className="mt-1 text-xs text-muted-foreground">
                      Paste your service account JSON from Google Cloud Console
                    </Small>
                  )}
                </div>
              )}
              {provider.auth !== "service_account" && (
                <Input
                  type={isViewingKey || isEditingKey ? "text" : "password"}
                  placeholder={
                    isEditMode && !isEditingKey
                      ? "••••••••••••••••"
                      : isEditingKey
                        ? "Enter new API key..."
                        : provider.apiKeyPlaceholder
                  }
                  value={isViewingKey && decryptedKey ? decryptedKey : keyValue}
                  onChange={(e) => handleKeyValueChange(e.target.value)}
                  className="h-7 flex-1 py-1 pr-16 text-xs"
                  disabled={isEditMode && !isEditingKey}
                />
              )}
              {provider.auth === "service_account" && isEditMode && (
                <div>
                  <Label>Service Account JSON</Label>
                  {isEditingKey ? (
                    <>
                      <Textarea
                        placeholder="Paste new service account JSON here..."
                        value={keyValue}
                        onChange={(e) =>
                          handleServiceAccountJsonChange(e.target.value)
                        }
                        className="font-mono min-h-[120px] resize-y text-xs"
                      />
                      {keyValue && (
                        <Small className="mt-1 text-xs text-muted-foreground">
                          Service account loaded ✓
                        </Small>
                      )}
                    </>
                  ) : (
                    <>
                      <Input
                        type="password"
                        placeholder="Service account configured"
                        value="••••••••••••••••"
                        className="h-7 flex-1 py-1 text-xs"
                        disabled={true}
                      />
                      {configValues.projectId && (
                        <Small className="mt-1 text-xs text-muted-foreground">
                          Project ID:{" "}
                          <span className="font-mono">
                            {configValues.projectId}
                          </span>
                        </Small>
                      )}
                    </>
                  )}
                </div>
              )}
              {/* Copy and Eye buttons inside input - not for service account file uploads */}
              {provider.auth !== "service_account" && (
                <div
                  className={cn(
                    "absolute right-1 flex -translate-y-1/2 items-center gap-1",
                    provider.id === "bedrock"
                      ? "top-[calc(50%+12px)]"
                      : "top-1/2",
                  )}
                >
                  {/* Copy button - always visible for existing keys, disabled when no value */}
                  {isEditMode ? (
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyToClipboard(
                          isViewingKey && decryptedKey
                            ? decryptedKey
                            : keyValue,
                        )
                      }
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                      disabled={
                        !(
                          (isViewingKey && decryptedKey) ||
                          (isEditingKey && keyValue)
                        )
                      }
                      title="Copy"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  ) : (
                    // For new keys, only show when there's a value
                    keyValue && (
                      <button
                        type="button"
                        onClick={() => handleCopyToClipboard(keyValue)}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="Copy"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    )
                  )}
                  {/* View/Hide button - only for existing keys */}
                  {isEditMode && !isEditingKey && (
                    <button
                      type="button"
                      onClick={handleToggleKeyVisibility}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      disabled={isLoading}
                      title={isViewingKey ? "Hide" : "View"}
                    >
                      {isLoading ? (
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : isViewingKey ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
            {provider.id === "bedrock" && (
              <div className="relative flex-1">
                <Label>Secret key</Label>
                <Input
                  type={isViewingKey || isEditingKey ? "text" : "password"}
                  placeholder={
                    isEditMode && !isEditingKey
                      ? "••••••••••••••••"
                      : isEditingKey
                        ? "Enter new secret key..."
                        : "..."
                  }
                  value={
                    isViewingKey && decryptedSecretKey
                      ? decryptedSecretKey
                      : secretKeyValue
                  }
                  onChange={(e) => setSecretKeyValue(e.target.value)}
                  className="h-7 flex-1 py-1 pr-16 text-xs"
                  disabled={isEditMode && !isEditingKey}
                />
                {/* Copy and Eye buttons inside input */}
                <div className="absolute right-1 top-[calc(50%+12px)] flex -translate-y-1/2 items-center gap-1">
                  {/* Copy button - always visible for existing keys, disabled when no value */}
                  {isEditMode ? (
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyToClipboard(
                          isViewingKey && decryptedSecretKey
                            ? decryptedSecretKey
                            : secretKeyValue,
                        )
                      }
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                      disabled={
                        !(
                          (isViewingKey && decryptedSecretKey) ||
                          (isEditingKey && secretKeyValue)
                        )
                      }
                      title="Copy"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  ) : (
                    // For new keys, only show when there's a value
                    secretKeyValue && (
                      <button
                        type="button"
                        onClick={() => handleCopyToClipboard(secretKeyValue)}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="Copy"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    )
                  )}
                  {/* View/Hide button - only for existing keys */}
                  {isEditMode && !isEditingKey && (
                    <button
                      type="button"
                      onClick={handleToggleKeyVisibility}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      disabled={isLoading}
                      title={isViewingKey ? "Hide" : "View"}
                    >
                      {isLoading ? (
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : isViewingKey ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* BYOK toggle */}
          <div className="mt-2 flex items-center gap-2">
            <Checkbox
              id={`byok-${existingKey?.id || instanceIndex}`}
              checked={byokEnabled}
              onCheckedChange={(checked) => setByokEnabled(!!checked)}
              disabled={isEditMode && !isEditingKey}
            />
            <Label
              htmlFor={`byok-${existingKey?.id || instanceIndex}`}
              className="cursor-pointer text-xs font-normal"
            >
              Enable for AI Gateway (BYOK)
            </Label>
          </div>

          {/* Save Key Confirmation Dialog */}
          <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Update Provider Key</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to update this {provider.name} key? This
                  will replace the existing key with the new value you&apos;ve
                  entered.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmSave}>
                  Update Key
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Advanced config fields */}
          {hasAdvancedConfig && renderConfigFields()}

          {/* Action buttons at bottom right */}
          <div className="mt-3 flex justify-end gap-2">
            {/* Cancel button when editing */}
            {isEditingKey && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                className="h-7 px-3 text-xs"
              >
                Cancel
              </Button>
            )}

            {/* Edit button - only for existing keys when not editing */}
            {isEditMode && !isEditingKey && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleEnterEditMode}
                className="h-7 px-3 text-xs"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <>
                    <Pencil className="mr-1 h-3 w-3" />
                    Edit
                  </>
                )}
              </Button>
            )}

            {/* Save/Add button - only show when adding new or editing */}
            {(!isEditMode || isEditingKey) && (
              <Button
                onClick={handleSaveKey}
                disabled={(!keyValue && !isEditMode) || isSavingKey}
                size="sm"
                className="h-7 px-3 text-xs"
              >
                {isSavingKey ? (
                  "Saving..."
                ) : isSavedLocal && !hasUnsavedChanges ? (
                  <>
                    <Check className="mr-1 h-3 w-3" />
                    Saved
                  </>
                ) : isEditMode ? (
                  <>
                    <Save className="mr-1 h-3 w-3" />
                    Save
                  </>
                ) : (
                  <>
                    <Plus className="mr-1 h-3 w-3" />
                    Add
                  </>
                )}
              </Button>
            )}

            {/* Delete button - only show for existing keys when not editing */}
            {isEditMode && existingKey && !isEditingKey && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isDeletingKey}
                    className="h-7 px-3 text-xs text-destructive hover:text-destructive"
                  >
                    {isDeletingKey ? (
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <>
                        <Trash2 className="mr-1 h-3 w-3" />
                        Delete
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Provider Key</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this {provider.name} key?
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteProviderKey.mutate(existingKey.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
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
      {/* Main header row - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 transition-colors hover:bg-muted/50"
      >
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
            <div className="text-sm font-medium">{provider.name}</div>
            {provider.note && (
              <div className="text-xs text-muted-foreground">
                {provider.note}
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              {existingKeys.length > 0 ? (
                <span className="text-green-600 dark:text-green-400">
                  {existingKeys.length} key
                  {existingKeys.length !== 1 ? "s" : ""} configured
                </span>
              ) : (
                <span className="text-muted-foreground">
                  No keys configured
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Expanded content - dropdown */}
      {isExpanded && (
        <div className="bg-muted/20">
          <div className="p-4">
            {/* For single-key providers */}
            {!provider.multipleAllowed && (
              <ProviderInstance
                provider={provider}
                existingKey={existingKeys[0]}
              />
            )}

            {/* For multi-key providers */}
            {provider.multipleAllowed && (
              <div className="space-y-3">
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

                {/* Add new instance button */}
                {!hasUnsavedForm && (
                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddInstance();
                      }}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add new key
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
