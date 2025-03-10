import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Small } from "@/components/ui/typography";
import { Trash } from "lucide-react";
import { ProviderKey } from "@/types/provider";
import useNotification from "@/components/shared/notification/useNotification";

interface ProviderKeysListProps {
  providerKeys: ProviderKey[];
  providerId: string;
  onDeleteKey: (keyId: string, providerId: string) => Promise<void>;
  viewDecryptedProviderKey: (keyId: string) => Promise<string | null>;
}

export const ProviderKeysList: React.FC<ProviderKeysListProps> = ({
  providerKeys,
  providerId,
  onDeleteKey,
  viewDecryptedProviderKey,
}) => {
  const [viewingKeyId, setViewingKeyId] = useState<string | null>(null);
  const [decryptedKey, setDecryptedKey] = useState<string | null>(null);
  const { setNotification } = useNotification();

  const handleViewKey = async (keyId: string) => {
    if (viewingKeyId === keyId && decryptedKey) {
      // If already viewing this key, hide it
      setViewingKeyId(null);
      setDecryptedKey(null);
      return;
    }

    setViewingKeyId(keyId);
    const key = await viewDecryptedProviderKey(keyId);
    setDecryptedKey(key);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setNotification("API key copied to clipboard", "success");
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
        setNotification("Failed to copy to clipboard", "error");
      });
  };

  if (providerKeys.length === 0) {
    return (
      <Small className="text-muted-foreground">
        No API keys linked to this configuration
      </Small>
    );
  }

  return (
    <div className="space-y-2 mt-2">
      {providerKeys.map((key) => (
        <div
          key={key.id}
          className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-md"
        >
          <div className="w-full">
            <div className="font-medium text-sm">{key.provider_key_name}</div>

            {viewingKeyId === key.id && decryptedKey && (
              <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <Small className="text-muted-foreground">API Key</Small>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 py-0 px-2"
                    onClick={() => copyToClipboard(decryptedKey)}
                  >
                    Copy
                  </Button>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                  <code className="text-xs break-all block">
                    {decryptedKey}
                  </code>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              variant={
                viewingKeyId === key.id && decryptedKey ? "secondary" : "ghost"
              }
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleViewKey(key.id);
              }}
            >
              {viewingKeyId === key.id && decryptedKey ? "Hide" : "View"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteKey(key.id, providerId);
              }}
            >
              <Trash className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
