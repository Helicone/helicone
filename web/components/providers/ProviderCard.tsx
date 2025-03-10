import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { ProviderKeysList } from "./ProviderKeysList";
import { AddProviderKeyForm } from "./AddProviderKeyForm";
import { Provider, ProviderKey } from "@/types/provider";
import { Label } from "@/components/ui/label";
import { Small, Muted } from "@/components/ui/typography";
import Link from "next/link";

interface ProviderCardProps {
  provider: Provider;
  expanded: boolean;
  onToggleExpand: () => void;
  isLoadingConfig: boolean;
  configId?: string;
  providerKeys: ProviderKey[];
  keyName: string;
  apiKey: string;
  onKeyNameChange: (value: string) => void;
  onApiKeyChange: (value: string) => void;
  onSaveKey: () => void;
  onDeleteKey: (keyId: string, providerId: string) => Promise<void>;
  onSaveConfig: () => Promise<string | undefined>;
  isSavingKey: boolean;
  isSavedKey: boolean;
  viewDecryptedProviderKey: (keyId: string) => Promise<string | null>;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  expanded,
  onToggleExpand,
  isLoadingConfig,
  configId,
  providerKeys,
  keyName,
  apiKey,
  onKeyNameChange,
  onApiKeyChange,
  onSaveKey,
  onDeleteKey,
  onSaveConfig,
  isSavingKey,
  isSavedKey,
  viewDecryptedProviderKey,
}) => {
  return (
    <div className={`${expanded ? "bg-gray-50 dark:bg-gray-900" : ""}`}>
      <div
        className="flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden">
            <img
              src={provider.logoUrl}
              alt={`${provider.name} logo`}
              className="h-5 w-5 object-contain"
              onError={(e) => {
                e.currentTarget.src = "/assets/home/providers/anthropic.png";
              }}
            />
          </div>
          <div className="flex-1">
            <div className="font-medium">{provider.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
          >
            {expanded ? "Cancel" : "Configure"}
          </Button>
          <ChevronRight
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              expanded ? "rotate-90" : ""
            }`}
          />
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-0">
          <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-700 mt-1 space-y-4">
            {/* Provider Configuration Section - Streamlined layout */}
            {!isLoadingConfig ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">
                    Provider Configuration
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSaveConfig();
                    }}
                    className="text-xs"
                  >
                    Save Configuration
                  </Button>
                </div>

                {configId ? (
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-md">
                    <div className="mb-3">
                      <Label className="text-xs font-medium mb-2 block">
                        Linked API Keys ({providerKeys.length})
                      </Label>
                      <ProviderKeysList
                        providerKeys={providerKeys}
                        providerId={provider.id}
                        onDeleteKey={onDeleteKey}
                        viewDecryptedProviderKey={viewDecryptedProviderKey}
                      />
                    </div>
                  </div>
                ) : (
                  <Muted className="text-xs mb-2 block">
                    No configuration created yet. Adding a key will create one
                    automatically.
                  </Muted>
                )}
              </div>
            ) : (
              <div className="flex justify-center py-3">
                <Small>Loading...</Small>
              </div>
            )}

            {/* Add New API Key Section - Streamlined */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Add New API Key</h3>
              <AddProviderKeyForm
                provider={provider}
                keyName={keyName}
                apiKey={apiKey}
                onKeyNameChange={onKeyNameChange}
                onApiKeyChange={onApiKeyChange}
                onSaveKey={onSaveKey}
                isSaving={isSavingKey}
                isSaved={isSavedKey}
              />
            </div>

            <div>
              <Link
                href={provider.docsUrl}
                className="text-xs text-primary"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                Documentation
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
