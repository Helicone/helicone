import { FormEvent, useState } from "react";
import { Result } from "../../../lib/result";
import { clsx } from "../../shared/clsx";
import useNotification from "../../shared/notification/useNotification";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

interface AddWebhookFormProps {
  refetchWebhooks: () => void;
  close: () => void;
}

const AddWebhookForm = (props: AddWebhookFormProps) => {
  const { refetchWebhooks, close } = props;

  const [isLoading, setIsLoading] = useState(false);
  const { setNotification } = useNotification();

  const handleSubmitHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const webhookUrl = event.currentTarget.elements.namedItem(
      "webhook-url"
    ) as HTMLInputElement;
    if (webhookUrl.value === "") {
      setNotification("Please enter a webhook URL", "error");
      return;
    }
    setIsLoading(true);
    await fetch("/api/webhooks/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        destination: webhookUrl.value,
      }),
    })
      .then((res) => res.json() as Promise<Result<boolean, string>>)
      .then((res) => {
        if (res.error) {
          setNotification(res.error, "error");
        } else {
          setNotification("Webhook created!", "success");
          refetchWebhooks();
          close();
        }
        setIsLoading(false);
      });
  };

  return (
    <form
      action="#"
      method="POST"
      onSubmit={handleSubmitHandler}
      className="flex flex-col gap-4 w-full space-y-4 min-w-[30rem]"
    >
      <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">
        Listen to events
      </p>
      <div className="space-y-1.5 text-sm">
        <label
          htmlFor="webhook-url"
          className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
        >
          Endpoint URL
        </label>
        <input
          type="text"
          name="webhook-url"
          id="webhook-url"
          className={clsx(
            "block w-full rounded-md border border-gray-300 dark:border-gray-700 shadow-sm p-2 text-sm"
          )}
          placeholder={"https://"}
        />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={close}
          className="flex flex-row items-center rounded-md bg-white dark:bg-black px-4 py-2 text-sm font-semibold border border-gray-300 hover:bg-gray-50 text-gray-900 dark:border-gray-700 dark:hover:bg-gray-900 dark:text-gray-100 shadow-sm hover:text-gray-700 dark:hover:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
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
          Add Webhook
        </button>
      </div>
    </form>
  );
};

export default AddWebhookForm;
