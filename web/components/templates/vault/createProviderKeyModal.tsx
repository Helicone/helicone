import { FormEvent, useState } from "react";
import ThemedModal from "../../shared/themed/themedModal";
import useNotification from "../../shared/notification/useNotification";
import { Result } from "../../../lib/result";
import { DecryptedProviderKey } from "../../../services/lib/keys";
import { clsx } from "../../shared/clsx";
import {
  ArrowPathIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useOrg } from "../../layout/organizationContext";
import { Select, SelectItem, TextInput } from "@tremor/react";
import { Tooltip } from "@mui/material";
import { useGetOrgMembers } from "../../../services/hooks/organizations";
import { useUser } from "@supabase/auth-helpers-react";

interface CreateProviderKeyModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess: () => void;
  variant?: "basic" | "portal";
}

const CreateProviderKeyModal = (props: CreateProviderKeyModalProps) => {
  const { open, setOpen, onSuccess, variant = "basic" } = props;

  const { setNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const org = useOrg();
  const user = useUser();

  const {
    data,
    isLoading: isMembersLoading,
    refetch,
  } = useGetOrgMembers(org?.currentOrg?.id || "");

  const currentUserRole = data?.find((d) => d.email === user?.email)?.org_role;

  const handleSubmitHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const keyName = event.currentTarget.elements.namedItem(
      "key-name"
    ) as HTMLInputElement;
    const providerKey = event.currentTarget.elements.namedItem(
      "provider-key"
    ) as HTMLInputElement;

    if ((!keyName || keyName.value === "") && variant !== "portal") {
      setNotification("Please enter in a key name", "error");
      setIsLoading(false);
      return;
    }
    if (!providerKey || providerKey.value === "") {
      setNotification("Please enter in a provider key", "error");
      setIsLoading(false);
      return;
    }

    if (currentUserRole === "member") {
      setNotification(
        "Members are not allowed to create provider keys",
        "error"
      );
      setIsLoading(false);
      return;
    }

    fetch("/api/provider_keys/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        providerKey: providerKey.value,
        providerName: variant === "portal" ? "portal" : "openai",
        providerKeyName: keyName.value,
      }),
    })
      .then(
        (res) => res.json() as Promise<Result<DecryptedProviderKey, string>>
      )
      .then(({ data }) => {
        if (data !== null) {
          setNotification("Successfully created provider key", "success");
          setOpen(false);
          onSuccess();
        } else {
          setNotification(
            "Failed to create provider key, you are only allowed 1 provider key",
            "error"
          );
        }
      })
      .catch((err) => {
        setNotification(`Error: ${err}`, "error");
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <ThemedModal open={open} setOpen={setOpen}>
      <form
        action="#"
        method="POST"
        onSubmit={handleSubmitHandler}
        className="flex flex-col space-y-8 w-[400px] text-gray-900 dark:text-gray-100"
      >
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Create Provider Key
        </h1>
        <div className="w-full space-y-1.5 text-sm">
          <label htmlFor="api-key">Provider</label>
          <Select defaultValue="openai" disabled enableClear={false}>
            <SelectItem value="openai">
              {variant === "portal" ? "Custom" : "OpenAI"}
            </SelectItem>
          </Select>
        </div>

        <div className="w-full space-y-1.5 text-sm">
          <label htmlFor="provider-key" className="flex items-center gap-1">
            Provider Key
            <Tooltip
              title={
                "This is the secret key that you get from the provider. It is used to authenticate and make requests to the provider's API."
              }
            >
              <InformationCircleIcon
                className={clsx("w-4 h-4 text-gray-500")}
              />
            </Tooltip>
          </label>
          <div className="text-gray-500 text-xs italic">
            This will be placed in the{" "}
            <code className="not-italic">authorization</code> header with the{" "}
            <code className="not-italic">Bearer</code> prefix.
          </div>
          <TextInput
            type="password"
            name="provider-key"
            id="provider-key"
            required
            placeholder="sk-"
          />
        </div>
        <div className="w-full space-y-1.5 text-sm">
          <label htmlFor="key-name">Key Name</label>
          <TextInput
            name="key-name"
            id="key-name"
            required
            placeholder="Provider Key Name"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setOpen(false)}
            type="button"
            className="flex flex-row items-center rounded-md bg-white dark:bg-black px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm hover:text-gray-700 dark:hover:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="items-center rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {isLoading && (
              <ArrowPathIcon className="w-4 h-4 mr-1.5 animate-spin" />
            )}
            Create Provider Key
          </button>
        </div>
      </form>
    </ThemedModal>
  );
};

export default CreateProviderKeyModal;
