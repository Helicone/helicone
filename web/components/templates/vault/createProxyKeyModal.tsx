import {
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  PlusCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { FormEvent, useEffect, useState } from "react";
import { Database } from "../../../db/database.types";
import { Result } from "@/packages/common/result";
import {
  DecryptedProviderKey,
  DecryptedProviderKeyMapping,
} from "../../../services/lib/keys";
import { clsx } from "../../shared/clsx";
import useNotification from "../../shared/notification/useNotification";
import ThemedModal from "../../shared/themed/themedModal";

interface CreateProxyKeyModalProps {
  providerKeys: DecryptedProviderKey[];
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess: () => void;
}
interface LimitRow {
  _limitType: "cost" | "count";
  cost?: number;
  count?: number;
  timewindow_seconds?: number;
}
const LimitRowDiv = (props: {
  limit: LimitRow;
  setLimit: (limit: LimitRow) => void;
  onDelete: () => void;
}) => {
  const { limit, setLimit, onDelete } = props;
  const { _limitType, cost, count, timewindow_seconds } = limit;
  const [timeGrain, setTimeGrain] = useState<
    "seconds" | "minutes" | "hours" | "days"
  >("seconds");
  return (
    <div className="flex flex-row items-center gap-2">
      <select
        className="block w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm"
        required
        value={_limitType}
        onChange={(e) => {
          const newLimit = { ...limit };
          newLimit._limitType = e.target.value as any;
          newLimit.cost = undefined;
          newLimit.count = undefined;
          setLimit(newLimit);
        }}
      >
        <option key={"cost-options"} value={"cost"}>
          cost
        </option>
        <option key={"cost-options"} value={"count"}>
          count
        </option>
      </select>

      <input
        type="number"
        className="block w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm"
        placeholder={_limitType === "cost" ? "Cost USD" : "Count"}
        value={_limitType === "cost" ? cost : count}
        onChange={(e) => {
          const newLimit = { ...limit };
          let value = Number(e.target.value);
          if (isNaN(value)) return;
          if (value < 0) value = 0;
          if (_limitType === "cost") {
            newLimit.cost = Number(value);
            newLimit.count = undefined;
          } else {
            newLimit.count = Number(value);
            newLimit.cost = undefined;
          }
          setLimit(newLimit);
        }}
      />
      {" For "}
      <input
        type="number"
        className="block w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm"
        placeholder="Time Window"
        value={(() => {
          if (timeGrain === "seconds") {
            return timewindow_seconds;
          } else if (timeGrain === "minutes") {
            return timewindow_seconds! / 60;
          } else if (timeGrain === "hours") {
            return timewindow_seconds! / 60 / 60;
          } else if (timeGrain === "days") {
            return timewindow_seconds! / 60 / 60 / 24;
          }
          return timewindow_seconds;
        })()}
        onChange={(e) => {
          const newLimit = { ...limit };
          let value = Number(e.target.value);
          if (isNaN(value)) return;
          if (value < 0) value = 0;
          if (timeGrain === "seconds") {
            newLimit.timewindow_seconds = Number(value);
          } else if (timeGrain === "minutes") {
            newLimit.timewindow_seconds = Number(value) * 60;
          } else if (timeGrain === "hours") {
            newLimit.timewindow_seconds = Number(value) * 60 * 60;
          } else if (timeGrain === "days") {
            newLimit.timewindow_seconds = Number(value) * 60 * 60 * 24;
          }
          setLimit(newLimit);
        }}
      />

      <select
        className="block w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm"
        required
        value={timeGrain}
        onChange={(e) => {
          setTimeGrain(e.target.value as any);
        }}
      >
        <option key={"seconds"} value={"seconds"}>
          seconds
        </option>
        <option key={"minutes"} value={"minutes"}>
          minutes
        </option>
        <option key={"hours"} value={"hours"}>
          hours
        </option>
        <option key={"days"} value={"days"}>
          days
        </option>
      </select>
      <div
        className="flex flex-row items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
        onClick={() => {
          onDelete();
        }}
      >
        <TrashIcon className="h-5 w-5 text-gray-900 hover:cursor-pointer" />
      </div>
    </div>
  );
};

const LimitsInput = (props: {
  setLimits: (
    limits: Database["public"]["Tables"]["helicone_proxy_key_limits"]["Insert"][],
  ) => void;
}) => {
  const [limits, setLimits] = useState<LimitRow[]>([]);

  return (
    <div className="flex flex-col space-y-1.5 text-sm">
      <label htmlFor="provider-key-name">Limits</label>
      {limits.map((limit, idx) => (
        <LimitRowDiv
          limit={limit}
          setLimit={(newLimit) => {
            const newLimits = [...limits];
            newLimits[idx] = newLimit;
            setLimits(newLimits);
            props.setLimits(
              newLimits.map((limit) => ({
                cost: limit.cost,
                count: limit.count,
                timewindow_seconds: limit.timewindow_seconds,
                id: crypto.randomUUID(),
                helicone_proxy_key: "null",
                currency: limit.cost ? "USD" : undefined,
              })),
            );
          }}
          onDelete={() => {
            const newLimits = [...limits];
            newLimits.splice(idx, 1);
            setLimits(newLimits);
            props.setLimits(
              newLimits.map((limit) => ({
                cost: limit.cost,
                count: limit.count,
                timewindow_seconds: limit.timewindow_seconds,
                id: crypto.randomUUID(),
                helicone_proxy_key: "null",
                currency: limit.cost ? "USD" : undefined,
              })),
            );
          }}
          key={`limit-${idx}`}
        />
      ))}
      <div
        className="flex w-fit flex-row gap-2 rounded-lg px-2 py-1 hover:cursor-pointer hover:bg-slate-300"
        onClick={() => {
          setLimits([
            ...limits,
            {
              _limitType: "cost",
              cost: undefined,
              count: undefined,
              timewindow_seconds: undefined,
            },
          ]);
        }}
      >
        <div>Add new limit</div>
        <PlusCircleIcon className="h-5 w-5 text-gray-900" />
      </div>
    </div>
  );
};

const CreateProxyKeyModal = (props: CreateProxyKeyModalProps) => {
  const { providerKeys, open, setOpen, onSuccess } = props;
  const [limits, setLimits] = useState<
    Database["public"]["Tables"]["helicone_proxy_key_limits"]["Insert"][]
  >([]);

  const [returnedKey, setReturnedKey] =
    useState<DecryptedProviderKeyMapping | null>(null);
  const { setNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(false);

  // returned key should be set to null when the modal is closed
  useEffect(() => {
    if (!open) {
      setReturnedKey(null);
    }
  }, [open]);

  const handleSubmitHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const proxyKeyName = event.currentTarget.elements.namedItem(
      "proxy-key-name",
    ) as HTMLInputElement;
    const providerKeyName = event.currentTarget.elements.namedItem(
      "provider-key-name",
    ) as HTMLInputElement;

    if (!proxyKeyName || proxyKeyName.value === "") {
      setNotification("Please enter in a key name", "error");
      return;
    }
    if (!providerKeyName || providerKeyName.value === "") {
      setNotification("Please enter in a provider key", "error");
      return;
    }

    fetch("/api/proxy_keys/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        heliconeProxyKeyName: proxyKeyName.value,
        providerKeyId: providerKeyName.value,
        limits: limits,
      }),
    })
      .then(
        (res) =>
          res.json() as Promise<Result<DecryptedProviderKeyMapping, string>>,
      )
      .then(({ data }) => {
        if (data) {
          setNotification("Proxy Key Created", "success");
          setReturnedKey(data);
          onSuccess();
        }
      })
      .catch(() => {
        setNotification("Error Creating Proxy Key", "error");
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <ThemedModal open={open} setOpen={setOpen}>
      {returnedKey === null ? (
        <form
          action="#"
          method="POST"
          onSubmit={handleSubmitHandler}
          className="flex w-[400px] flex-col space-y-8 text-gray-900 dark:text-gray-100"
        >
          <h1 className="text-lg font-semibold">Create Proxy Key</h1>
          <div className="w-full space-y-1.5 text-sm">
            <label htmlFor="proxy-key-name">Proxy Key Name</label>
            <input
              type="text"
              name="proxy-key-name"
              id="proxy-key-name"
              className={clsx(
                "block w-full rounded-md border border-gray-500 bg-gray-100 p-2 text-sm shadow-sm dark:bg-gray-900",
              )}
              required
              placeholder="Proxy Key Name"
            />
          </div>
          <div className="w-full space-y-1.5 text-sm">
            <label htmlFor="provider-key-name">Provider Key Name</label>
            <select
              id="provider-key-name"
              name="provider-key-name"
              className="block w-full rounded-md border border-gray-500 bg-gray-100 p-2 text-sm shadow-sm dark:bg-gray-900"
              required
            >
              {providerKeys.map((key) => (
                <option key={key.id} value={key.id!}>
                  {key.provider_key_name}
                </option>
              ))}
            </select>
          </div>
          <LimitsInput setLimits={setLimits} />

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setOpen(false)}
              type="button"
              className="flex flex-row items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 dark:border-gray-700 dark:bg-black dark:text-gray-100 dark:hover:bg-gray-900 dark:hover:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              {isLoading && (
                <ArrowPathIcon className="mr-1.5 h-4 w-4 animate-spin" />
              )}
              Create Proxy Key
            </button>
          </div>
        </form>
      ) : (
        <div className="flex w-[400px] flex-col space-y-4">
          <h1 className="text-lg font-semibold text-gray-900">
            Your Proxy Key
          </h1>
          <p className="text-sm text-gray-500">
            Please copy this key and store it somewhere safe. You will not be
            able to see it again.
          </p>
          <div className="w-full space-y-1.5 text-sm">
            <div className="flex w-full flex-row items-center gap-4">
              <input
                type="text"
                name="proxy-key-name"
                id="proxy-key-name"
                disabled
                className={clsx(
                  "block w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm",
                )}
                value={returnedKey.helicone_proxy_key}
              />
              <button
                className="flex items-center rounded-md bg-black p-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                onClick={() => {
                  navigator.clipboard.writeText(returnedKey.helicone_proxy_key);
                  setNotification("Copied to clipboard!", "success");
                }}
              >
                <ClipboardDocumentListIcon className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => setOpen(false)}
              type="button"
              className="flex flex-row items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </ThemedModal>
  );
};

export default CreateProxyKeyModal;
