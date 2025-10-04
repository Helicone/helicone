// pages/Vault.tsx
import AuthHeader from "@/components/shared/authHeader";
import { FeatureUpgradeCard } from "@/components/shared/helicone/FeatureUpgradeCard";
import { InfoBox } from "@/components/ui/helicone/infoBox";
import { KeyIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import {
  DecryptedProviderKey,
  DecryptedProviderKeyMapping,
} from "../../../services/lib/keys";
import { useOrg } from "../../layout/org/organizationContext";
import useNotification from "../../shared/notification/useNotification";
import ThemedModal from "../../shared/themed/themedModal";
import ThemedTable, { ThemedTableProps } from "../../shared/themed/themedTable";
import CreateProviderKeyModal from "./createProviderKeyModal";
import CreateProxyKeyModal from "./createProxyKeyModal";
import { useVaultPage } from "./useVaultPage";

const VaultPage = ({
  variant = "basic",
  onRadioSelect,
}: {
  variant?: "basic" | "portal";
  onRadioSelect?: (value: string | null) => void;
}) => {
  const [deleteProviderOpen, setDeleteProviderOpen] = useState(false);
  const [selectedProviderKey, setSelectedProviderKey] =
    useState<DecryptedProviderKey>();

  const [deleteProxyOpen, setDeleteProxyOpen] = useState(false);
  const [selectedProxyKey, setSelectedProxyKey] =
    useState<DecryptedProviderKeyMapping>();

  const [selectedProviderKeyForRadio, setSelectedProviderKeyForRadio] =
    useState<DecryptedProviderKey["id"]>();

  const { setNotification } = useNotification();

  const {
    isLoading,
    providerKeys,
    refetchProviderKeys,
    proxyKeys,
    refetchProxyKeys,
  } = useVaultPage();

  const [isProviderOpen, setIsProviderOpen] = useState(false);
  const [isProxyOpen, setIsProxyOpen] = useState(false);
  const org = useOrg();

  const deleteProviderKey = async (id: string) => {
    fetch(`/api/provider_keys/${id}/delete`, { method: "DELETE" })
      .then(() => {
        refetchProviderKeys();
        refetchProxyKeys();
        setNotification("Provider Key Deleted", "success");
        setDeleteProviderOpen(false);
      })
      .catch(() => {
        setNotification("Error Deleting Provider Key", "error");
        setDeleteProviderOpen(false);
      });
  };

  const deleteHeliconeProxyKey = async (id: string) => {
    fetch(`/api/proxy_keys/${id}/delete`, { method: "DELETE" })
      .then(() => {
        refetchProxyKeys();
        setNotification("Proxy Key Deleted", "success");
        setDeleteProxyOpen(false);
      })
      .catch(() => {
        setNotification("Error Deleting Proxy Key", "error");
        setDeleteProxyOpen(false);
      });
  };
  const proxyKeyColumns: ThemedTableProps["columns"] = [
    {
      name: "Name",
      key: "helicone_proxy_key_name",
      hidden: false,
    },
    {
      name: "Provider Key Name",
      key: "provider_key_name",
      hidden: false,
    },
  ];

  if (
    org?.currentOrg?.tier !== "enterprise" &&
    org?.currentOrg?.tier !== "pro-20240913" &&
    org?.currentOrg?.tier !== "pro-20250202" &&
    org?.currentOrg?.tier !== "team-20250130"
  ) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] flex-col items-center space-y-8">
        <InfoBox variant="warning" className="mb-4 max-w-xl">
          Vault is only available for Pro and Enterprise plans. If you have any
          issues, please contact us at support@helicone.ai.
        </InfoBox>
        <FeatureUpgradeCard
          title="Unlock Vault"
          headerTagline="The Free plan does not include the Vault feature, but getting access is easy."
          featureName="Vault"
          icon={
            <KeyIcon className="h-8 w-8 text-gray-900 dark:text-gray-100" />
          }
        />
      </div>
    );
  }
  return (
    <>
      <AuthHeader title={"Vault"} />
      <div className="flex max-w-3xl flex-col space-y-12 divide-y divide-gray-300 py-4 dark:divide-gray-700">
        <div className="flex flex-col space-y-4">
          <div className="flex w-full flex-row items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Provider Keys
            </h1>
            <button
              onClick={() => {
                setIsProviderOpen(true);
              }}
              className="flex flex-row whitespace-nowrap rounded-md bg-gray-900 py-2 pl-3 pr-4 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:bg-gray-100 dark:text-black dark:hover:bg-gray-300"
            >
              Add Provider Key
            </button>
          </div>
          <p className="text-gray-500">
            {variant === "portal"
              ? "The key you enter will be added within the `Authorization` header of your API requests. Select which key you want to associate with this organization"
              : "These keys will be used to authenticate with your provider."}
          </p>
          {isLoading ? (
            <ul className="flex flex-col space-y-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <li
                  key={index}
                  className="flex h-6 animate-pulse flex-row justify-between gap-2 rounded-md bg-gray-300 dark:bg-gray-700"
                ></li>
              ))}
            </ul>
          ) : providerKeys.length > 0 ? (
            <ThemedTable
              columns={[
                ...(onRadioSelect
                  ? [
                      {
                        name: "",
                        key: "radio_select",
                        hidden: false,
                        className: "w-8",
                      },
                    ]
                  : []),
                { name: "Name", key: "provider_key_name", hidden: false },
                {
                  name: "Key",
                  key: "provider_key",
                  hidden: false,
                  secret: true,
                },
                { name: "Provider", key: "provider_name", hidden: true },
              ]}
              rows={
                variant === "portal"
                  ? providerKeys
                      .filter((x) => x.provider_name === "portal")
                      .map((x) => ({
                        ...x,
                        radio_select: (
                          <input
                            type="radio"
                            name="providerKey"
                            value={+(selectedProviderKeyForRadio === x.id)}
                            onChange={() => {
                              setSelectedProviderKeyForRadio(x.id);
                              onRadioSelect && onRadioSelect(x?.id ?? null);
                            }}
                          />
                        ),
                      }))
                  : providerKeys
              }
              deleteHandler={(row) => {
                setSelectedProviderKey(row);
                setDeleteProviderOpen(true);
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsProviderOpen(true);
              }}
              className="relative flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 p-12 text-center hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-black"
            >
              <KeyIcon className="h-8 w-8 text-gray-900 dark:text-gray-100" />
              <span className="mt-2 block text-sm font-semibold text-gray-900 dark:text-gray-100">
                Add a provider key
              </span>
            </button>
          )}
        </div>
        {variant === "basic" && (
          <div className="flex flex-col space-y-4 pt-12">
            <div className="flex w-full flex-row items-center justify-between">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Helicone Proxy Keys
              </h1>
              <button
                onClick={() => {
                  setIsProxyOpen(true);
                }}
                className="flex flex-row whitespace-nowrap rounded-md bg-gray-900 py-2 pl-3 pr-4 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:bg-gray-100 dark:text-black dark:hover:bg-gray-300"
              >
                Create Proxy Key
              </button>
            </div>
            <p className="text-gray-500">
              These keys will replace your provider keys in your application.
              This ensures that any usage will be logged in Helicone.
            </p>
            {isLoading ? (
              <ul className="flex flex-col space-y-6">
                {Array.from({ length: 3 }).map((_, index) => (
                  <li
                    key={index}
                    className="flex h-6 animate-pulse flex-row justify-between gap-2 rounded-md bg-gray-300 dark:bg-gray-700"
                  ></li>
                ))}
              </ul>
            ) : proxyKeys.length > 0 ? (
              <ThemedTable
                columns={proxyKeyColumns}
                rows={proxyKeys}
                deleteHandler={(row) => {
                  setSelectedProxyKey(row);
                  setDeleteProxyOpen(true);
                }}
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsProxyOpen(true);
                }}
                className="relative flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 p-12 text-center hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-black"
              >
                <KeyIcon className="h-8 w-8 text-gray-900 dark:text-gray-100" />
                <span className="mt-2 block text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Add a proxy key
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      <CreateProviderKeyModal
        open={isProviderOpen}
        variant={variant}
        setOpen={setIsProviderOpen}
        onSuccess={() => refetchProviderKeys()}
      />
      <CreateProxyKeyModal
        providerKeys={providerKeys}
        open={isProxyOpen}
        setOpen={setIsProxyOpen}
        onSuccess={() => refetchProxyKeys()}
      />
      <ThemedModal open={deleteProviderOpen} setOpen={setDeleteProviderOpen}>
        <div className="flex w-full flex-col gap-4">
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Delete Provider Key
          </p>
          <p className="w-[400px] whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
            This Provider Key will be deleted from your account. All proxy keys
            that are mapped to this provider key will be deleted as well. Are
            you sure you want to delete this provider key?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteProviderOpen(false)}
              type="button"
              className="flex flex-row items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 dark:border-gray-700 dark:bg-black dark:text-gray-100 dark:hover:bg-gray-900 dark:hover:text-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (selectedProviderKey?.id) {
                  await deleteProviderKey(selectedProviderKey.id!);
                }
              }}
              className="flex items-center rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:text-black"
            >
              Delete
            </button>
          </div>
        </div>
      </ThemedModal>
      <ThemedModal open={deleteProxyOpen} setOpen={setDeleteProxyOpen}>
        <div className="flex w-full flex-col gap-4">
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Delete Proxy Key
          </p>
          <p className="w-[400px] whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
            This Proxy Key will be deleted from your account. Are you sure you
            want to delete this proxy key?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteProxyOpen(false)}
              type="button"
              className="flex flex-row items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 dark:border-gray-700 dark:bg-black dark:text-gray-100 dark:hover:bg-gray-900 dark:hover:text-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (selectedProxyKey?.id) {
                  await deleteHeliconeProxyKey(selectedProxyKey.id!);
                }
              }}
              className="flex items-center rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:text-black"
            >
              Delete
            </button>
          </div>
        </div>
      </ThemedModal>
    </>
  );
};

export default VaultPage;
