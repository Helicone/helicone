import { useState } from "react";
import { clsx } from "../../shared/clsx";
import useNotification from "../../shared/notification/useNotification";
import ThemedModal from "../../shared/themed/themedModal";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useGetOrgMembers } from "../../../services/hooks/organizations";
import { useUserSettings } from "../../../services/hooks/userSettings";

interface AddMemberModalProps {
  orgId: string;
  orgOwnerId: string;
  open: boolean;
  setOpen: (open: boolean) => void;

  onSuccess?: () => void;
}

const AddMemberModal = (props: AddMemberModalProps) => {
  const { orgId, orgOwnerId, open, setOpen, onSuccess } = props;

  const [isLoading, setIsLoading] = useState(false);

  const { setNotification } = useNotification();
  const { data, refetch } = useGetOrgMembers(orgId);

  const { isLoading: isUserSettingsLoading, userSettings } =
    useUserSettings(orgOwnerId);

  const members = data?.data
    ? data?.data.map((d) => {
        return {
          ...d,
          isOwner: false,
        };
      })
    : [];

  const onSubmitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    if (userSettings?.tier === "free" && members.length >= 4) {
      setNotification(
        "You have reached the maximum number of members for the free plan.",
        "error"
      );
      setIsLoading(false);
      return;
    }

    if (userSettings?.tier === "pro" && members.length >= 9) {
      setNotification(
        "You have reached the maximum number of members for the pro plan.",
        "error"
      );
      setIsLoading(false);
      return;
    }

    const email = e.currentTarget.elements.namedItem(
      "email"
    ) as HTMLInputElement;

    if (!email || !email.value) {
      setNotification("Failed to add member. Please try again.", "error");
      return;
    }

    fetch(`/api/organization/${orgId}/add_member`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.value,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.error) {
          if (res.error.length < 30) {
            setNotification(res.error, "error");
            console.error(res);
          } else {
            setNotification("Error adding member", "error");
            console.error(res);
          }
        } else {
          setNotification("Member added successfully", "success");
          onSuccess && onSuccess();
          setOpen(false);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <ThemedModal open={open} setOpen={setOpen}>
      <form
        action="#"
        method="POST"
        onSubmit={onSubmitHandler}
        className="flex flex-col gap-4 w-full"
      >
        <p className="font-semibold text-lg">Add New Member</p>
        <div className="space-y-1.5 text-sm w-[400px]">
          <label htmlFor="email">User Email</label>
          <input
            type="email"
            name="email"
            id="email"
            className={clsx(
              "block w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
            )}
            placeholder={"Enter user email"}
          />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
            }}
            className="flex flex-row items-center rounded-md bg-white px-4 py-2 text-sm font-semibold border border-gray-300 hover:bg-gray-50 text-gray-900 shadow-sm hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="items-center rounded-md bg-black px-4 py-2 text-sm flex font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {isLoading && (
              <ArrowPathIcon className="w-4 h-4 mr-1.5 animate-spin" />
            )}
            Add Member
          </button>
        </div>
      </form>
    </ThemedModal>
  );
};

export default AddMemberModal;
