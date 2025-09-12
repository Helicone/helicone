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
  const [configVisible, setConfigVisible] = useState(false);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [byokEnabled, setByokEnabled] = useState(false);
  const [isSavingByok, setIsSavingByok] = useState(false);
  const [showByokConfirm, setShowByokConfirm] = useState(false);
  const [pendingByokValue, setPendingByokValue] = useState<boolean | null>(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

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
        logger.error({ error, keyId: existingKey.id }, "Error fetching key for edit");
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

  const handleByokToggle = (checked: boolean) => {
    // Store the pending value and show confirmation
    setPendingByokValue(checked);
    setShowByokConfirm(true);
  };

  const handleByokConfirm = async () => {
    if (pendingByokValue === null || !existingKey) return;
    
    setIsSavingByok(true);
    setShowByokConfirm(false);
    
    try {
      // Update only the BYOK setting - explicitly pass undefined for other fields
      await updateProviderKey.mutateAsync({
        keyId: existingKey.id,
        key: undefined,  // Don't update the key
        secretKey: undefined,  // Don't update the secret key
        config: undefined,  // Don't update config
        byokEnabled: pendingByokValue,
      });
      
      setByokEnabled(pendingByokValue);
      setNotification(
        pendingByokValue 
          ? "AI Gateway (BYOK) enabled" 
          : "AI Gateway (BYOK) disabled",
        "success"
      );
    } catch (error) {
      logger.error({ error }, "Failed to update BYOK setting");
      setNotification("Failed to update AI Gateway setting", "error");
    } finally {
      setIsSavingByok(false);
      setPendingByokValue(null);
    }
  };

  const handleByokCancel = () => {
    setShowByokConfirm(false);
    setPendingByokValue(null);
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
          config: configValues,
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
    if (!isEditingKey || (!keyValue && provider.id !== "aws")) {
      setNotification("Please enter a new key or cancel editing", "error");
      return;
    }
    
    try {
      // Update the provider key
      updateProviderKey.mutate({
        key: keyValue || undefined, // Only send if there's a value
        secretKey: secretKeyValue || undefined,
        keyId: existingKey.id,
        config: configValues,
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
          : "",
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
                  {existingKey?.provider_key_name || `Instance ${instanceIndex + 1}`}
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
                          <Copy className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 text-muted-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Copy Key ID</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
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
                className="h-7 flex-1 py-1 pr-8 text-xs"
                disabled={isEditMode && !isEditingKey}
              />
              {/* Copy button inside input */}
              {((isViewingKey && decryptedKey) || (isEditingKey && keyValue)) && (
                <button
                  type="button"
                  onClick={() => handleCopyToClipboard(
                    isViewingKey && decryptedKey ? decryptedKey : keyValue
                  )}
                  className={cn(
                    "absolute right-1 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground",
                    provider.id === "aws" ? "top-[calc(50%+12px)]" : "top-1/2"
                  )}
                  title="Copy"
                >
                  <Copy className="h-3 w-3" />
                </button>
              )}
            </div>
            {provider.id === "aws" && (
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
                  className="h-7 flex-1 py-1 pr-8 text-xs"
                  disabled={isEditMode && !isEditingKey}
                />
                {/* Copy button inside input */}
                {((isViewingKey && decryptedSecretKey) || (isEditingKey && secretKeyValue)) && (
                  <button
                    type="button"
                    onClick={() => handleCopyToClipboard(
                      isViewingKey && decryptedSecretKey ? decryptedSecretKey : secretKeyValue
                    )}
                    className="absolute right-1 top-[calc(50%+12px)] -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Copy"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              {/* Show eye toggle for both new and existing keys */}
              {!isEditingKey && (
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
              )}

              {/* Edit button - only for existing keys */}
              {isEditMode && !isEditingKey && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleEnterEditMode}
                        className="h-7 w-7 text-blue-500"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Pencil className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit key</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Cancel button when editing */}
              {isEditingKey && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="h-7 px-2 text-xs"
                >
                  Cancel
                </Button>
              )}

              {/* Save/Add button - only show when adding new or editing */}
              {(!isEditMode || isEditingKey) && (
                <Button
                  onClick={handleSaveKey}
                  disabled={
                    (!keyValue && !isEditMode) ||
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
                      <Save className="h-3.5 w-3.5" /> Save
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" /> Add
                    </>
                  )}
                </Button>
              )}

              {/* Delete button - only show for existing keys */}
              {isEditMode && existingKey && (
                <AlertDialog>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={isDeletingKey}
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {isDeletingKey ? (
                              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent>Delete key</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Provider Key</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this {provider.name} key? This
                        action cannot be undone.
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

          {/* BYOK toggle */}
          <div className="mt-2 flex items-center gap-2">
            <Checkbox
              id={`byok-${existingKey?.id || instanceIndex}`}
              checked={byokEnabled}
              onCheckedChange={(checked) => {
                if (isEditMode) {
                  // For existing keys, show confirmation and auto-save
                  handleByokToggle(!!checked);
                } else {
                  // For new keys, just update state (will save with the key)
                  setByokEnabled(!!checked);
                }
              }}
              disabled={isSavingByok}
            />
            <Label
              htmlFor={`byok-${existingKey?.id || instanceIndex}`}
              className="cursor-pointer text-xs font-normal"
            >
              Enable for AI Gateway (BYOK)
              {isSavingByok && (
                <span className="ml-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
            </Label>
          </div>

          {/* BYOK Confirmation Dialog */}
          <AlertDialog open={showByokConfirm} onOpenChange={setShowByokConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {pendingByokValue ? "Enable" : "Disable"} AI Gateway (BYOK)
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {pendingByokValue
                    ? "This will enable your key for use with AI Gateway. Your key will be available for BYOK (Bring Your Own Key) requests."
                    : "This will disable your key for AI Gateway. BYOK requests using this key will no longer work."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={handleByokCancel}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleByokConfirm}>
                  {pendingByokValue ? "Enable" : "Disable"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Save Key Confirmation Dialog */}
          <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Update Provider Key</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to update this {provider.name} key? This will replace the existing key with the new value you've entered.
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
        className="w-full p-3 hover:bg-muted/50 transition-colors"
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
                  {existingKeys.length} key{existingKeys.length !== 1 ? "s" : ""} configured
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
        <div className="border-t border-border/50 bg-muted/20">
          <div className="p-4">
            {/* For single-key providers */}
            {!provider.multipleAllowed && (
              <ProviderInstance provider={provider} existingKey={existingKeys[0]} />
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
