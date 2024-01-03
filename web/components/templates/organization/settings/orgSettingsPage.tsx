import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { Database } from "../../../../supabase/database.types";
import { clsx } from "../../../shared/clsx";
import CreateOrgForm from "../createOrgForm";
import ThemedModal from "../../../shared/themed/themedModal";
import { useState } from "react";
import useNotification from "../../../shared/notification/useNotification";
import { useRouter } from "next/router";
import { useOrg } from "../../../shared/layout/organizationContext";

interface OrgSettingsPageProps {
  org: Database["public"]["Tables"]["organization"]["Row"];
}

const OrgSettingsPage = (props: OrgSettingsPageProps) => {
  const { org } = props;
  const user = useUser();
  const orgContext = useOrg();
  const router = useRouter();
  const { setNotification } = useNotification();
  const supabaseClient = useSupabaseClient();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isOwner = org.owner === user?.id;

  return (
    <>
      <div className="py-4 flex flex-col text-gray-900 dark:text-gray-100 w-full max-w-2xl">
        <div className="text-sm pb-8 max-w-[450px] w-full flex flex-col space-y-1.5">
          <label
            htmlFor="org-id"
            className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
          >
            Organization Id
          </label>
          <input
            type="text"
            name="org-id"
            id="org-id"
            value={org.id}
            className={clsx(
              "block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 shadow-sm p-2 text-sm"
            )}
            placeholder={"Your shiny new org name"}
            disabled
          />
        </div>
        <div className="max-w-[450px] w-full">
          <CreateOrgForm
            initialValues={{
              id: org.id,
              name: org.name,
              color: org.color || "",
              icon: org.icon || "",
            }}
          />
        </div>
        {isOwner && !org.is_personal && (
          <div className="py-36 flex flex-col">
            <div className="flex flex-row">
              <button
                type="button"
                className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30"
                onClick={() => setDeleteOpen(true)}
              >
                Delete Organization
              </button>
            </div>
          </div>
        )}
      </div>
      <ThemedModal open={deleteOpen} setOpen={setDeleteOpen}>
        <div className="flex flex-col gap-4 w-full">
          <p className="font-semibold text-lg">Delete Organization</p>
          <p className="text-gray-700 w-[400px] whitespace-pre-wrap text-sm">
            This organization will be deleted from your account.
          </p>
          <p className="text-gray-700 w-[400px] whitespace-pre-wrap text-sm">
            This is an irreversible action and cannot be undone, please confirm
            you want to delete this organization.
          </p>
          <div className="w-full flex justify-end gap-4 mt-4">
            <button
              onClick={() => {
                setDeleteOpen(false);
              }}
              className={clsx(
                "relative inline-flex items-center rounded-md hover:bg-gray-50 bg-white px-4 py-2 text-sm font-medium text-gray-700"
              )}
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                const { data, error } = await supabaseClient
                  .from("organization")
                  .update({ soft_delete: true })
                  .eq("id", org.id);

                if (error) {
                  setNotification("Error deleting organization", "error");
                  setDeleteOpen(false);
                } else {
                  orgContext?.refetchOrgs();
                  setDeleteOpen(false);
                  router.push("/requests");
                  router.push("/requests");
                  setNotification("Delete organization", "success");
                }
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
    </>
  );
};

export default OrgSettingsPage;
