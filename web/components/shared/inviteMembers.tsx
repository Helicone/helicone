import { useState } from "react";
import ThemedModal from "./themed/themedModal";
import { clsx } from "./clsx";
import { useOrg } from "./layout/organizationContext";
import useNotification from "./notification/useNotification";
import { UserPlusIcon } from "@heroicons/react/24/outline";

interface InviteMemberButtonProps {
  onSuccess?: () => void;
  variant?: "primary" | "secondary";
}

const InviteMemberButton = (props: InviteMemberButtonProps) => {
  const { onSuccess, variant = "primary" } = props;

  const [addOpen, setAddOpen] = useState(false);

  const org = useOrg();
  const { setNotification } = useNotification();

  const onSubmitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const email = e.currentTarget.elements.namedItem(
      "email"
    ) as HTMLInputElement;

    if (!email || !email.value || !org?.currentOrg) {
      setNotification("Failed to add member. Please try again.", "error");
      return;
    }

    fetch(
      `/api/organization/${org?.currentOrg.id}/add_member?email=${email.value}`
    )
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
          setAddOpen(false);
        }
      });
  };

  return (
    <>
      <button
        onClick={() => setAddOpen(true)}
        className={clsx(
          variant === "primary"
            ? "items-center rounded-md bg-black px-4 py-2 text-sm flex font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            : "flex items-center space-x-2 text-gray-700 hover:bg-sky-100 rounded-md text-sm pl-4 py-2 w-full truncate"
        )}
      >
        {variant === "secondary" && (
          <UserPlusIcon className="h-4 w-4 text-gray-500 mr-2" />
        )}
        Invite Members
      </button>
      <ThemedModal open={addOpen} setOpen={setAddOpen}>
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
                setAddOpen(false);
              }}
              className="flex flex-row items-center rounded-md bg-white px-4 py-2 text-sm font-semibold border border-gray-300 hover:bg-gray-50 text-gray-900 shadow-sm hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={() => {
                if (!org?.currentOrg) {
                  setNotification(
                    "Invalid organization. Please log out and try again",
                    "error"
                  );
                  return;
                }
              }}
              className="items-center rounded-md bg-black px-4 py-2 text-sm flex font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Add Member
            </button>
          </div>
        </form>
      </ThemedModal>
    </>
  );
};

export default InviteMemberButton;
