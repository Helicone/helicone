import {
  BuildingOffice2Icon,
  BuildingOfficeIcon,
  BuildingStorefrontIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useState } from "react";
import {
  useGetOrgMembers,
  useGetOrgOwner,
} from "../../../services/hooks/organizations";
import { Database } from "../../../supabase/database.types";
import { clsx } from "../../shared/clsx";
import useNotification from "../../shared/notification/useNotification";
import ThemedModal from "../../shared/themed/themedModal";
import { getUSDate } from "../../shared/utils/utils";
import { ORGANIZATION_COLORS, ORGANIZATION_ICONS } from "./createOrgForm";

interface OrgCardProps {
  org: {
    created_at: string | null;
    id: string;
    is_personal: boolean;
    name: string;
    owner: string;
    soft_delete: boolean;
    color: string;
    icon: string;
  };
  refetchOrgs: () => void;
  isOwner?: boolean;
}

const OrgCard = (props: OrgCardProps) => {
  const { org, refetchOrgs, isOwner = false } = props;
  const user = useUser();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");

  const supabaseClient = useSupabaseClient<Database>();

  const { data: orgOwner, isLoading: isOrgOwnerLoading } = useGetOrgOwner(
    org.owner
  );

  const {
    data: orgMembers,
    isLoading: isOrgMembersLoading,
    refetch,
  } = useGetOrgMembers(org.id);

  const { setNotification } = useNotification();

  const isLoading = isOrgOwnerLoading || isOrgMembersLoading;

  const icon = ORGANIZATION_ICONS.find((icon) => icon.name === org.icon);
  const color = ORGANIZATION_COLORS.find((color) => color.name === org.color);

  return (
    <>
      <li
        key={org.id}
        className="overflow-hidden border border-gray-300 rounded-xl w-full"
      >
        <div
          className={clsx(
            color ? color.bgColor : "bg-gray-200",
            "p-4 flex flex-row justify-between"
          )}
        >
          <div className="flex flex-row space-x-4 items-center">
            {icon ? (
              <icon.icon
                className={clsx(
                  color ? color.textColor : "text-gray-200",
                  "h-8 w-8 bg-white p-1.5 rounded-md"
                )}
              />
            ) : (
              <BuildingOfficeIcon className="h-8 w-8 bg-white p-1.5 rounded-md" />
            )}
            <p className="text-md font-semibold flex-1 overflow-ellipsis truncate w-[150px]">
              {org.name}
            </p>
          </div>
          {isOwner && (
            <div className="flex flex-row space-x-2 items-center">
              <button
                onClick={() => setAddOpen(true)}
                className="hover:bg-white rounded-md p-1.5"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
              {!org.is_personal && (
                <button
                  onClick={() => setDeleteOpen(true)}
                  className="hover:bg-white rounded-md p-1.5"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
        <div className="bg-white px-4 flex flex-col divide-y divide-gray-200 text-sm">
          {isOwner ? (
            <div className="py-3 flex flex-row justify-between">
              <p className="text-gray-500">Created At</p>
              <p className="text-gray-700">
                {getUSDate(org.created_at as string)}
              </p>
            </div>
          ) : (
            <div className="py-3 flex flex-row justify-between">
              <p className="text-gray-500">Owner</p>
              <p className="text-gray-700">{orgOwner?.data?.at(0)?.email}</p>
            </div>
          )}

          <div className="py-3 flex flex-row justify-between">
            <p className="text-gray-500">Members</p>
            <div className="text-gray-700">
              {isLoading ? (
                <div className="h-4 w-8 bg-gray-300 rounded-xl animate-pulse" />
              ) : (
                `${(orgMembers?.data?.length || 0) + 1}`
              )}
            </div>
          </div>
        </div>
      </li>

      <ThemedModal open={addOpen} setOpen={setAddOpen}>
        <div className="flex flex-col gap-4 w-full">
          <p className="font-semibold text-lg">Add New Member</p>
          <div className="space-y-1.5 text-sm w-[400px]">
            <label htmlFor="api-key">User Email</label>
            <input
              type="text"
              name="api-key"
              id="api-key"
              value={addEmail}
              className={clsx(
                "block w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
              )}
              placeholder={"Enter user email"}
              onChange={(e) => setAddEmail(e.target.value)}
            />
          </div>
          <div className="w-full flex justify-end gap-4 mt-4">
            <button
              onClick={() => {
                setAddOpen(false);
              }}
              className={clsx(
                "relative inline-flex items-center rounded-md hover:bg-gray-50 bg-white px-4 py-2 text-sm font-medium text-gray-700"
              )}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                fetch(
                  `/api/organization/${org.id}/add_member?email=${addEmail}`
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
                    }
                    refetch();
                    setAddOpen(false);
                  });
              }}
              className={clsx(
                "relative inline-flex items-center rounded-md hover:bg-sky-400 bg-sky-500 px-4 py-2 text-sm font-medium text-white"
              )}
            >
              Add Member
            </button>
          </div>
        </div>
      </ThemedModal>

      <ThemedModal open={deleteOpen} setOpen={setDeleteOpen}>
        <div className="flex flex-col gap-4 w-full">
          <p className="font-semibold text-lg">Delete Organization</p>
          <p className="text-gray-700 w-[400px] whitespace-pre-wrap text-sm">
            This organization will be deleted from your account. API requests
            already made with this organization&apos;s will still be stored on
            our servers.
          </p>
          <p className="text-gray-700 w-[400px] whitespace-pre-wrap text-sm">
            If you delete this organization and re-add the keys to it later, the
            requests made with this organization will become visible again.
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
                console.log("deleting org", org.id);
                const { data, error } = await supabaseClient
                  .from("organization")
                  .update({ soft_delete: true })
                  .eq("id", org.id);
                console.log(data, error);
                if (error) {
                  setNotification("Error deleting organization", "error");
                } else {
                  setNotification(
                    "Organization deleted successfully",
                    "success"
                  );
                }
                refetchOrgs();
                setDeleteOpen(false);
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

export default OrgCard;
