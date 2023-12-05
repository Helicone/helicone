import { AcademicCapIcon } from "@heroicons/react/20/solid";
import { ChevronDownIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Tooltip } from "@mui/material";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { Database } from "../../../supabase/database.types";
import { clsx } from "../../shared/clsx";
import useNotification from "../../shared/notification/useNotification";
import ThemedDropdown from "../../shared/themed/themedDropdown";
import ThemedModal from "../../shared/themed/themedModal";

interface OrgMemberItemProps {
  index: number;
  orgMember: {
    email: string | undefined;
    member: string | undefined;
    isOwner: boolean;
    org_role: string | undefined;
  };
  isUserAdmin: boolean;
  orgId: string;
  refetch: () => void;
  refreshOrgs: () => void;
}

const OrgMemberItem = (props: OrgMemberItemProps) => {
  const { index, orgMember, isUserAdmin, orgId, refetch, refreshOrgs } = props;

  const { setNotification } = useNotification();

  const [openDelete, setOpenDelete] = useState(false);

  const user = useUser();

  const router = useRouter();

  const [memberRole, setMemberRole] = useState<string>(
    orgMember.org_role || "member"
  );

  const isUser = orgMember.member === user?.id;

  return (
    <>
      <li key={index} className="py-3 grid grid-cols-8 gap-2 items-center">
        <p className="truncate overflow-ellipsis col-span-8 md:col-span-4">
          {orgMember.email}
        </p>
        <div className="col-span-4 md:col-span-2 w-fit md:min-w-[8rem]">
          {isUserAdmin ? (
            <ThemedDropdown
              options={[
                {
                  label: "admin",
                  value: "admin",
                  subtitle: "Can manage members, configurations, and settings",
                },
                {
                  label: "member",
                  value: "member",
                  subtitle: "Can view data, create keys, and use API",
                },
              ]}
              selectedValue={memberRole}
              onSelect={(role) => {
                fetch(`/api/organization/${orgId}/update_member`, {
                  method: "PATCH",
                  body: JSON.stringify({
                    orgRole: role,
                    memberId: orgMember.member,
                  } as {
                    orgRole: string;
                    memberId: string;
                  }),
                  headers: {
                    "Content-Type": "application/json",
                  },
                })
                  .then((res) => res.json())
                  .then((res) => {
                    if (res.error) {
                      setNotification("Error updating member", "error");
                      console.error(res);
                    } else {
                      setNotification("Successfully updated member", "success");
                    }
                  });
                setMemberRole(role);
              }}
            />
          ) : (
            <Tooltip title="Requires admin privileges">
              <div
                className={clsx(
                  "bg-gray-50 dark:bg-gray-900 hover:cursor-not-allowed relative w-full cursor-default rounded-md border border-gray-300 dark:border-gray-700 py-2 pl-3 pr-10 text-left shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:text-sm"
                )}
              >
                <span className="block truncate">{orgMember.org_role}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronDownIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </span>
              </div>
            </Tooltip>
          )}
        </div>
        <div className="col-span-4 md:col-span-2 flex justify-end">
          {orgMember.isOwner ? (
            <span className="inline-flex items-center rounded-full bg-white dark:bg-black px-2 py-1 text-xs font-medium text-gray-500 ring-1 ring-inset ring-gray-300 dark:ring-gray-700">
              <AcademicCapIcon className="h-4 w-4 mr-1" />
              Owner
            </span>
          ) : isUser ? (
            <button
              onClick={() => {
                fetch(
                  `/api/organization/${orgId}/remove_member?memberId=${orgMember.member}`
                )
                  .then((res) => res.json())
                  .then((res) => {
                    if (res.error) {
                      if (res.error.length < 30) {
                        setNotification(res.error, "error");
                        console.error(res);
                      } else {
                        setNotification("Error leaving organizationr", "error");
                        console.error(res);
                      }
                    } else {
                      setNotification(
                        "Successfully left organization",
                        "success"
                      );
                    }
                    refreshOrgs();
                  })
                  .finally(() => {
                    router.push("/dashboard");
                  });
              }}
            >
              <p className="hover:bg-gray-200 dark:hover:bg-gray-800 inline-flex items-center rounded-full bg-white dark:bg-black px-2 py-1 text-xs font-medium text-gray-500 ring-1 ring-inset ring-gray-300 dark:ring-gray-700">
                Leave
              </p>
            </button>
          ) : isUserAdmin ? (
            <button
              onClick={() => {
                setOpenDelete(true);
              }}
            >
              <p className="hover:bg-gray-200 dark:hover:bg-gray-800 inline-flex items-center rounded-full bg-white dark:bg-black px-2 py-1 text-xs font-medium text-gray-500 ring-1 ring-inset ring-gray-300 dark:ring-gray-700">
                Remove
              </p>
            </button>
          ) : (
            <div></div>
          )}
        </div>
      </li>
      <ThemedModal open={openDelete} setOpen={setOpenDelete}>
        <div className="flex flex-col space-y-4 sm:space-y-8 min-w-[25rem]">
          <div className="flex flex-col space-y-2">
            <p className="text-sm sm:text-md font-semibold text-gray-900 dark:text-gray-100">
              Remove Member
            </p>
            <p className="text-sm sm:text-md text-gray-500">
              {`Are you sure you want to remove member: ${orgMember.email}?`}
            </p>
          </div>

          <div className="w-full flex justify-end text-sm space-x-2">
            <button
              type="button"
              onClick={() => setOpenDelete(false)}
              className="flex flex-row items-center rounded-md bg-white dark:bg-black px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm hover:text-gray-700 dark:hover:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
            >
              Cancel
            </button>
            <button
              className="items-center rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              onClick={() => {
                fetch(
                  `/api/organization/${orgId}/remove_member?memberId=${orgMember.member}`
                )
                  .then((res) => res.json())
                  .then((res) => {
                    if (res.error) {
                      if (res.error.length < 30) {
                        setNotification(res.error, "error");
                        console.error(res);
                      } else {
                        setNotification("Error removing member", "error");
                        console.error(res);
                      }
                    } else {
                      setNotification("Member removed successfully", "success");
                    }
                    refetch();
                    setOpenDelete(false);
                  });
              }}
            >
              Remove
            </button>
          </div>
        </div>
      </ThemedModal>
    </>
  );
};

export default OrgMemberItem;
