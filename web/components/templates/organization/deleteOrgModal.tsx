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
      <div className="flex flex-col gap-4 w-full">
        <p className="font-semibold text-lg">Delete Organization</p>
        <p className="text-gray-700 w-[400px] whitespace-pre-wrap text-sm">
          Organization {` "${orgName}" `} will be deleted from your account.
        </p>
        <p className="text-gray-700 w-[400px] whitespace-pre-wrap text-sm">
          This is an irreversible action and cannot be undone, please confirm
          you want to delete this organization.
        </p>
        <div className="flex flex-col gap-1 py-4">
          <i className="text-gray-700 whitespace-pre-wrap text-xs">
            Confirm the name of the organization you want to delete
          </i>
          <input
            type="text"
            name="confirm-org-name"
            id="confirm-org-name"
            value={confirmOrgName}
            className={clsx(
              "block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm p-2 text-sm"
            )}
            placeholder={orgName}
            onChange={(e) => setConfirmOrgName(e.target.value)}
          />
        </div>
        <div className="w-full flex justify-end gap-4 mt-4">
          <button
            onClick={() => {
              setOpen(false);
            }}
            className={clsx(
              "relative inline-flex items-center rounded-md hover:bg-gray-50 bg-white px-4 py-2 text-sm font-medium text-gray-700"
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
                  "error"
                );
                return;
              }

              if (confirmOrgName !== orgName) {
                setNotification("Organization name does not match", "error");
                return;
              }

              const { error: deleteOrgError } = await jawn.DELETE(
                `/v1/organization/delete`
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
              "relative inline-flex items-center rounded-md hover:bg-red-700 bg-red-500 px-4 py-2 text-sm font-medium text-white"
            )}
          >
            Delete
          </button>
        </div>
      </div>
    </ThemedModal>
  );
};
