// pages/providerKeys.tsx
import { useEffect, useState } from "react";
import { Result } from "../lib/result";
import generateApiKey from "generate-api-key";
import {
  DecryptedProviderKey,
  DecryptedProviderKeyMapping,
} from "../services/lib/keys";

const ProviderKeysPage = () => {
  const [providerKeys, setProviderKeys] = useState<DecryptedProviderKey[]>([]);
  const [heliconeProxyKeys, setHeliconeProxyKeys] = useState<
    DecryptedProviderKeyMapping[]
  >([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [newProviderName, setNewProviderName] = useState("");
  const [newProxyKeyName, setNewProxyKeyName] = useState("");
  const [newProviderKeySelected, setNewProviderKeySelected] = useState("");

  useEffect(() => {
    fetch("/api/provider_keys/get")
      .then(
        (res) => res.json() as Promise<Result<DecryptedProviderKey[], string>>
      )
      .then(({ data }) => data && setProviderKeys(data))
      .catch(console.error);

    fetch("/api/helicone_proxy_keys/get")
      .then(
        (res) =>
          res.json() as Promise<Result<DecryptedProviderKeyMapping[], string>>
      )
      .then(({ data }) => data && setHeliconeProxyKeys(data))
      .catch(console.error);
  }, []);

  const createProviderKey = async (
    providerName: string,
    providerKey: string,
    providerKeyName: string
  ) => {
    fetch("/api/provider_keys/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ providerKey, providerName, providerKeyName }),
    })
      .then(
        (res) => res.json() as Promise<Result<DecryptedProviderKey, string>>
      )
      .then(({ data }) => data && setProviderKeys((prev) => [...prev, data]))
      .catch(console.error);
    setNewKeyName("");
    setNewKeyValue("");
  };

  function generateAPIKey() {
    const apiKey = `sk-helicone-proxy${generateApiKey({
      method: "base32",
      dashes: true,
    }).toString()}`.toLowerCase();
    return apiKey;
  }

  const deleteProviderKey = async (id: string) => {
    fetch(`/api/provider_keys/${id}/delete`, { method: "DELETE" })
      .then(() =>
        setProviderKeys((prev) => prev.filter((key) => key.id !== id))
      )
      .catch(console.error);
  };

  const createHeliconeProxyKey = async (
    heliconeProxyKeyName: string,
    providerKeyId: string,
    heliconeProxyKey: string
  ) => {
    fetch("/api/helicone_proxy_keys/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        heliconeProxyKeyName,
        providerKeyId,
        heliconeProxyKey,
      }),
    })
      .then(
        (res) =>
          res.json() as Promise<Result<DecryptedProviderKeyMapping, string>>
      )
      .then(
        ({ data }) => data && setHeliconeProxyKeys((prev) => [...prev, data])
      )
      .catch(console.error);
    setNewProxyKeyName("");
    setNewProviderKeySelected("");
  };

  const deleteHeliconeProxyKey = async (id: string) => {
    fetch(`/api/helicone_proxy_keys/${id}/delete`, { method: "DELETE" })
      .then(() =>
        setHeliconeProxyKeys((prev) => prev.filter((key) => key.id !== id))
      )
      .catch(console.error);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Provider Keys</h1>
      <div>
        {providerKeys.map((key) => (
          <div key={key.id} className="mb-2">
            <span className="font-bold">{key.provider_key_name}</span>:{" "}
            {key.provider_key} | {key.provider_name}
            <button
              className="ml-2 text-white bg-red-500 p-1 rounded"
              onClick={() => deleteProviderKey(key.id!)}
            >
              Delete
            </button>
          </div>
        ))}
        <div className="mt-4">
          <input
            className="border p-2 rounded"
            placeholder="Name"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
          />
          <input
            className="border p-2 rounded ml-2"
            placeholder="Key"
            value={newKeyValue}
            onChange={(e) => setNewKeyValue(e.target.value)}
          />
          <input
            className="border p-2 rounded ml-2"
            placeholder="Provider Name"
            value={newProviderName}
            onChange={(e) => setNewProviderName(e.target.value)}
          />
          <button
            className="ml-2 bg-blue-500 text-white p-2 rounded"
            onClick={() =>
              createProviderKey(newProviderName, newKeyValue, newKeyName)
            }
          >
            Add
          </button>
        </div>
      </div>

      <h1 className="text-2xl mb-4">Helicone Proxy Keys</h1>
      <div>
        {heliconeProxyKeys.map((key) => (
          <div key={key.id} className="mb-2">
            <span className="font-bold">{key.helicone_proxy_key_name}</span>:{" "}
            {key.helicone_proxy_key} | {key.provider_key_name}
            <button
              className="ml-2 text-white bg-red-500 p-1 rounded"
              onClick={() => deleteHeliconeProxyKey(key.id!)}
            >
              Delete
            </button>
          </div>
        ))}
        <div className="mt-4">
          <input
            className="border p-2 rounded"
            placeholder="Proxy Key Name"
            value={newProxyKeyName}
            onChange={(e) => setNewProxyKeyName(e.target.value)}
          />
          <select
            className="border p-2 rounded ml-2"
            value={newProviderKeySelected}
            onChange={(e) => setNewProviderKeySelected(e.target.value)}
          >
            <option value="">Select Provider Key</option>
            {providerKeys.map((key) => (
              <option key={key.id} value={key.id!}>
                {key.provider_key_name}
              </option>
            ))}
          </select>
          <button
            className="ml-2 bg-blue-500 text-white p-2 rounded"
            onClick={() =>
              createHeliconeProxyKey(
                newProxyKeyName,
                newProviderKeySelected,
                generateAPIKey()
              )
            }
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProviderKeysPage;
