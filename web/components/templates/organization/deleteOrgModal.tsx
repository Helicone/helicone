import { clsx } from "../../shared/clsx";
import { useOrg } from "../../layout/org/organizationContext";
import useNotification from "../../shared/notification/useNotification";
import ThemedModal from "../../shared/themed/themedModal";
import { useRouter } from "next/router";
import { useState } from "react";
import { getJawnClient } from "../../../lib/clients/jawn";

interface DeleteOrgModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  orgId: string;
  orgName: string;
  onDeleteRoute: string | null;
}
export const DeleteOrgModal = (props: DeleteOrgModalProps) => {
  const { open: isOpen, orgId, orgName, setOpen, onDeleteRoute } = props;

  const { setNotification } = useNotification();
  const orgContext = useOrg();
  const router = useRouter();
  const jawn = getJawnClient(orgId);
  const [confirmOrgName, setConfirmOrgName] = useState("");

  return (
    <ThemedModal open={isOpen} setOpen={setOpen}>
      <div className="flex w-full flex-col gap-4">
        <p className="text-lg font-semibold">Delete Organization</p>
        <p className="w-[400px] whitespace-pre-wrap text-sm text-gray-700">
          Organization {` "${orgName}" `} will be deleted from your account.
        </p>
        <p className="w-[400px] whitespace-pre-wrap text-sm text-gray-700">
          This is an irreversible action and cannot be undone, please confirm
          you want to delete this organization.
        </p>
        <div className="flex flex-col gap-1 py-4">
          <i className="whitespace-pre-wrap text-xs text-gray-700">
            Confirm the name of the organization you want to delete
          </i>
          <input
            type="text"
            name="confirm-org-name"
            id="confirm-org-name"
            value={confirmOrgName}
            className={clsx(
              "block w-full rounded-md border border-gray-300 bg-gray-100 p-2 text-sm text-gray-900 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100",
            )}
            placeholder={orgName}
            onChange={(e) => setConfirmOrgName(e.target.value)}
          />
        </div>
        <div className="mt-4 flex w-full justify-end gap-4">
          <button
            onClick={() => {
              setOpen(false);
            }}
            className={clsx(
              "relative inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50",
            )}
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              if (
                orgContext?.currentOrg?.tier === "pro-20240913" ||
                orgContext?.currentOrg?.tier === "pro-20250202" ||
                orgContext?.currentOrg?.tier === "team-20250130" ||
                orgContext?.currentOrg?.tier === "growth"
              ) {
                setNotification(
                  "You cannot delete your organization while on the Pro plan",
                  "error",
                );
                return;
              }

              if (confirmOrgName !== orgName) {
                setNotification("Organization name does not match", "error");
                return;
              }

              const { error: deleteOrgError } = await jawn.DELETE(
                `/v1/organization/delete`,
              );

              if (deleteOrgError) {
                console.error(deleteOrgError);
                setNotification("Error deleting organization", "error");
              } else {
                orgContext?.refetchOrgs();
                if (onDeleteRoute) {
                  router.push(onDeleteRoute || "/request");
                }
                setNotification("Delete organization", "success");
              }

              setOpen(false);
            }}
            className={clsx(
              "relative inline-flex items-center rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-700",
            )}
          >
            Delete
          </button>
        </div>
      </div>
    </ThemedModal>
  );
};
