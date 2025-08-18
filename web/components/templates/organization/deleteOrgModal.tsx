import { useOrg } from "../../layout/org/organizationContext";
import useNotification from "../../shared/notification/useNotification";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/router";
import { logger } from "@/lib/telemetry/logger";
import { useState } from "react";
import { getJawnClient } from "../../../lib/clients/jawn";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Organization</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Organization <span className="font-medium">{` "${orgName}" `}</span>{" "}
          will be deleted from your account.
        </DialogDescription>
        <DialogDescription>
          This is an irreversible action and cannot be undone, please confirm
          you want to delete this organization.
        </DialogDescription>
        <div className="flex flex-col gap-1">
          <i className="whitespace-pre-wrap text-xs dark:text-slate-500">
            Confirm the name of the organization you want to delete
          </i>
          <Input
            type="text"
            name="confirm-org-name"
            id="confirm-org-name"
            value={confirmOrgName}
            placeholder={orgName}
            onChange={(e) => setConfirmOrgName(e.target.value)}
          />
          {/* <input
            type="text"
            name="confirm-org-name"
            id="confirm-org-name"
            value={confirmOrgName}
            className={clsx(
              "block w-full rounded-md border border-gray-300 bg-gray-100 p-2 text-sm text-gray-900 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100",
            )}
            placeholder={orgName}
            onChange={(e) => setConfirmOrgName(e.target.value)}
          /> */}
        </div>
        <div className="mt-4 flex w-full justify-end gap-4">
          <Button
            onClick={() => {
              setOpen(false);
            }}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
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
                logger.error(
                  { error: deleteOrgError },
                  "Error deleting organization",
                );
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
            variant="destructive"
          >
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
