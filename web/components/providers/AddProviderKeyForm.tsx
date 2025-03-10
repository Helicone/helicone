import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Plus } from "lucide-react";
import { Provider } from "@/types/provider";

interface AddProviderKeyFormProps {
  provider: Provider;
  keyName: string;
  apiKey: string;
  onKeyNameChange: (value: string) => void;
  onApiKeyChange: (value: string) => void;
  onSaveKey: () => void;
  isSaving: boolean;
  isSaved: boolean;
}

export const AddProviderKeyForm: React.FC<AddProviderKeyFormProps> = ({
  provider,
  keyName,
  apiKey,
  onKeyNameChange,
  onApiKeyChange,
  onSaveKey,
  isSaving,
  isSaved,
}) => {
  return (
    <div className="space-y-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-md">
      <div>
        <Label
          htmlFor={`${provider.id}-keyName`}
          className="text-xs text-muted-foreground mb-1 block"
        >
          Key Name
        </Label>
        <Input
          id={`${provider.id}-keyName`}
          placeholder="e.g., Production Key"
          value={keyName}
          onChange={(e) => onKeyNameChange(e.target.value)}
          className="w-full text-sm"
        />
      </div>

      <div>
        <Label
          htmlFor={`${provider.id}-apiKey`}
          className="text-xs text-muted-foreground mb-1 block"
        >
          {provider.apiKeyLabel}
        </Label>
        <div className="flex gap-2">
          <Input
            id={`${provider.id}-apiKey`}
            type="password"
            placeholder={provider.apiKeyPlaceholder}
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            className="flex-1 text-sm"
          />
          <Button
            onClick={onSaveKey}
            disabled={!apiKey || isSaving}
            size="sm"
            className="flex items-center gap-1 whitespace-nowrap"
          >
            {isSaving ? (
              "Saving..."
            ) : isSaved ? (
              <>
                <Check className="h-3 w-3" /> Saved
              </>
            ) : (
              <>
                <Plus className="h-3 w-3" /> Add Key
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
