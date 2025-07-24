import { TooltipLegacy as Tooltip } from "@/components/ui/tooltipLegacy";
import { AcademicCapIcon } from "@heroicons/react/20/solid";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { useState } from "react";
import { useJawnClient } from "../../../lib/clients/jawnHook";
import { clsx } from "../../shared/clsx";
import useNotification from "../../shared/notification/useNotification";
import ThemedDropdown from "../../shared/themed/themedDropdown";
import ThemedModal from "../../shared/themed/themedModal";
import { useHeliconeAuthClient } from "@/packages/common/auth/client/AuthClientFactory";

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

  const { user } = useHeliconeAuthClient();

  const router = useRouter();

  const jawn = useJawnClient();

  const [memberRole, setMemberRole] = useState<string>(
    orgMember.org_role || "member",
  );

  const isUser = orgMember.member === user?.id;

  return (
    <>
      <li key={index} className="grid grid-cols-12 items-center gap-2 py-3">
        <div className="col-span-8 flex flex-row items-center justify-start gap-2">
          <p className="truncate overflow-ellipsis text-sm">
            {orgMember.email}
          </p>
          {isUser && (
            <div className="flex justify-end gap-2">
              <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-700/10 dark:bg-sky-900/20 dark:text-sky-300 dark:ring-sky-300/20">
                Current User
              </span>
            </div>
          )}
        </div>
        <div className="col-span-2 w-fit md:min-w-[8rem]">
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
              onSelect={async (role) => {
                const { data, error } = await jawn.POST(
                  "/v1/organization/{organizationId}/update_member",
                  {
                    params: {
                      path: {
                        organizationId: orgId,
                      },
                    },
                    body: {
                      role: role,
                      memberId: orgMember.member!,
                    },
                  },
                );
                if (error) {
                  setNotification("Error updating member", "error");
                  console.error(error);
                } else {
                  setNotification("Successfully updated member", "success");
                }
                setMemberRole(role);
              }}
            />
          ) : (
            <Tooltip title="Requires admin privileges">
              <div
                className={clsx(
                  "relative w-full cursor-default rounded-md border border-gray-300 bg-gray-50 py-2 pl-3 pr-10 text-left shadow-sm hover:cursor-not-allowed focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-700 dark:bg-gray-900 sm:text-sm",
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
        <div className="col-span-2 flex justify-end gap-2">
          {orgMember.isOwner ? (
            <span className="inline-flex items-center rounded-full bg-white px-2 py-1 text-xs font-medium text-gray-500 ring-1 ring-inset ring-gray-300 dark:bg-black dark:ring-gray-700">
              <AcademicCapIcon className="mr-1 h-4 w-4" />
              Owner
            </span>
          ) : isUserAdmin ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpenDelete(true)}
              >
                Remove
              </Button>
            </>
          ) : isUser ? (
            <button
              onClick={async () => {
                const { data, error } = await jawn.DELETE(
                  `/v1/organization/{organizationId}/remove_member`,
                  {
                    params: {
                      path: {
                        organizationId: orgId,
                      },
                      query: {
                        memberId: orgMember.member!,
                      },
                    },
                  },
                );
                if (error) {
                  setNotification("Error leaving organization", "error");
                  console.error(error);
                } else {
                  setNotification("Successfully left organization", "success");
                }
                refreshOrgs();
                router.push("/dashboard");
              }}
            >
              <p className="inline-flex items-center rounded-full bg-white px-2 py-1 text-xs font-medium text-gray-500 ring-1 ring-inset ring-gray-300 hover:bg-gray-200 dark:bg-black dark:ring-gray-700 dark:hover:bg-gray-800">
                Leave
              </p>
            </button>
          ) : (
            <div></div>
          )}
        </div>
      </li>

      <ThemedModal open={openDelete} setOpen={setOpenDelete}>
        <div className="flex min-w-[25rem] flex-col space-y-4 sm:space-y-8">
          <div className="flex flex-col space-y-2">
            <p className="sm:text-md text-sm font-semibold text-gray-900 dark:text-gray-100">
              Remove Member
            </p>
            <p className="sm:text-md text-sm text-gray-500">
              {`Are you sure you want to remove member: ${orgMember.email}?`}
            </p>
          </div>

          <div className="flex w-full justify-end space-x-2 text-sm">
            <button
              type="button"
              onClick={() => setOpenDelete(false)}
              className="flex flex-row items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 dark:border-gray-700 dark:bg-black dark:text-gray-100 dark:hover:bg-gray-900 dark:hover:text-gray-300"
            >
              Cancel
            </button>
            <button
              className="flex items-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
              onClick={async () => {
                const { data, error } = await jawn.DELETE(
                  `/v1/organization/{organizationId}/remove_member`,
                  {
                    params: {
                      path: {
                        organizationId: orgId,
                      },
                      query: {
                        memberId: orgMember.member!,
                      },
                    },
                  },
                );
                if (error) {
                  setNotification("Error removing member", "error");
                  console.error(error);
                } else {
                  setNotification("Member removed successfully", "success");
                }
                refetch();
                setOpenDelete(false);
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
