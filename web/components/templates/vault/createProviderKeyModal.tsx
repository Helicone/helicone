import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TooltipLegacy as Tooltip } from "@/components/ui/tooltipLegacy";
import { useHeliconeAuthClient } from "@/packages/common/auth/client/AuthClientFactory";
import {
  ArrowPathIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { FormEvent, useState } from "react";
import { Result } from "@/packages/common/result";
import { useGetOrgMembers } from "../../../services/hooks/organizations";
import { DecryptedProviderKey } from "../../../services/lib/keys";
import { useOrg } from "../../layout/org/organizationContext";
import { clsx } from "../../shared/clsx";
import useNotification from "../../shared/notification/useNotification";
import ThemedModal from "../../shared/themed/themedModal";

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
  const { user } = useHeliconeAuthClient();

  const { data, refetch } = useGetOrgMembers(org?.currentOrg?.id || "");

  const currentUserRole = data?.find((d) => d.email === user?.email)?.org_role;

  const handleSubmitHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const keyName = event.currentTarget.elements.namedItem(
      "key-name",
    ) as HTMLInputElement;
    const providerKey = event.currentTarget.elements.namedItem(
      "provider-key",
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
        "error",
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
        (res) => res.json() as Promise<Result<DecryptedProviderKey, string>>,
      )
      .then(({ data }) => {
        if (data !== null) {
          setNotification("Successfully created provider key", "success");
          setOpen(false);
          onSuccess();
        } else {
          setNotification(
            "Failed to create provider key, you are only allowed 1 provider key",
            "error",
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
        className="flex w-[400px] flex-col space-y-8 text-gray-900 dark:text-gray-100"
      >
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Create Provider Key
        </h1>
        <div className="w-full space-y-1.5 text-sm">
          <label htmlFor="api-key">Provider</label>
          <Select defaultValue="openai" disabled>
            <SelectTrigger>
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">
                {variant === "portal" ? "Custom" : "OpenAI"}
              </SelectItem>
            </SelectContent>
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
                className={clsx("h-4 w-4 text-gray-500")}
              />
            </Tooltip>
          </label>
          <div className="text-xs italic text-gray-500">
            This will be placed in the{" "}
            <code className="not-italic">authorization</code> header with the{" "}
            <code className="not-italic">Bearer</code> prefix.
          </div>
          <Input
            type="password"
            name="provider-key"
            id="provider-key"
            required
            placeholder="sk-"
          />
        </div>
        <div className="w-full space-y-1.5 text-sm">
          <label htmlFor="key-name">Key Name</label>
          <Input
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
            Create Provider Key
          </button>
        </div>
      </form>
    </ThemedModal>
  );
};

export default CreateProviderKeyModal;
