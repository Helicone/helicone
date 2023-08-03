// pages/Vault.tsx
import { useEffect, useState } from "react";
import { Result } from "../../../lib/result";
import generateApiKey from "generate-api-key";
import {
  DecryptedProviderKey,
  DecryptedProviderKeyMapping,
} from "../../../services/lib/keys";
import ThemedTable from "../../shared/themed/themedTable";
import CreateProviderKeyButton from "./createProviderKeyButton";
import { useVaultPage } from "./useVaultPage";
import ThemedModal from "../../shared/themed/themedModal";
import { clsx } from "../../shared/clsx";
import useNotification from "../../shared/notification/useNotification";
import CreateProxyKeyButton from "./createProxyKeyButton";

const VaultPage = () => {
  const [deleteProviderOpen, setDeleteProviderOpen] = useState(false);
  const [selectedProviderKey, setSelectedProviderKey] =
    useState<DecryptedProviderKey>();

  const [deleteProxyOpen, setDeleteProxyOpen] = useState(false);
  const [selectedProxyKey, setSelectedProxyKey] =
    useState<DecryptedProviderKeyMapping>();

  const { setNotification } = useNotification();

  const {
    isLoading,
    providerKeys,
    refetchProviderKeys,
    proxyKeys,
    refetchProxyKeys,
  } = useVaultPage();

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

  return (
    <>
      <div className="flex flex-col space-y-12 divide-y divide-gray-300 max-w-2xl py-4">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-row justify-between w-full items-center">
            <h1 className="font-semibold text-2xl text-gray-900">
              Provider Keys
            </h1>
            <CreateProviderKeyButton onSuccess={() => refetchProviderKeys()} />
          </div>
          <p className="text-gray-600">
            These keys will be used to authenticate with your provider.
          </p>
          <ThemedTable
            columns={[
              { name: "Name", key: "provider_key_name", hidden: false },
              { name: "Key", key: "provider_key", hidden: false },
              { name: "Provider", key: "provider_name", hidden: false },
            ]}
            rows={providerKeys}
            deleteHandler={(row) => {
              setSelectedProviderKey(row);
              setDeleteProviderOpen(true);
            }}
          />
        </div>
        <div className="flex flex-col space-y-4 pt-12">
          <div className="flex flex-row justify-between w-full items-center">
            <h1 className="font-semibold text-2xl text-gray-900">
              Helicone Proxy Keys
            </h1>
            <CreateProxyKeyButton
              onSuccess={() => refetchProxyKeys()}
              providerKeys={providerKeys}
            />
          </div>
          <p className="text-gray-600">
            These keys will replace your provider keys in your application. This
            ensures that any usage will be logged in Helicone.
          </p>
          <ThemedTable
            columns={[
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
            ]}
            rows={proxyKeys}
            deleteHandler={(row) => {
              setSelectedProxyKey(row);
              setDeleteProxyOpen(true);
            }}
          />
        </div>
      </div>
      <ThemedModal open={deleteProviderOpen} setOpen={setDeleteProviderOpen}>
        <div className="flex flex-col gap-4 w-full">
          <p className="font-semibold text-lg">Delete Provider Key</p>
          <p className="text-gray-700 w-[400px] whitespace-pre-wrap text-sm">
            This Provider Key will be deleted from your account. All proxy keys
            that are mapped to this provider key will be deleted as well. Are
            you sure you want to delete this provider key?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteProviderOpen(false)}
              type="button"
              className="flex flex-row items-center rounded-md bg-white px-4 py-2 text-sm font-semibold border border-gray-300 hover:bg-gray-50 text-gray-900 shadow-sm hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (selectedProviderKey?.id) {
                  await deleteProviderKey(selectedProviderKey.id!);
                }
              }}
              className="items-center rounded-md bg-red-600 px-4 py-2 text-sm flex font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Delete
            </button>
          </div>
        </div>
      </ThemedModal>
      <ThemedModal open={deleteProxyOpen} setOpen={setDeleteProxyOpen}>
        <div className="flex flex-col gap-4 w-full">
          <p className="font-semibold text-lg">Delete Proxy Key</p>
          <p className="text-gray-700 w-[400px] whitespace-pre-wrap text-sm">
            This Proxy Key will be deleted from your account. Are you sure you
            want to delete this proxy key?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteProxyOpen(false)}
              type="button"
              className="flex flex-row items-center rounded-md bg-white px-4 py-2 text-sm font-semibold border border-gray-300 hover:bg-gray-50 text-gray-900 shadow-sm hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (selectedProxyKey?.id) {
                  await deleteHeliconeProxyKey(selectedProxyKey.id!);
                }
              }}
              className="items-center rounded-md bg-red-600 px-4 py-2 text-sm flex font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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
