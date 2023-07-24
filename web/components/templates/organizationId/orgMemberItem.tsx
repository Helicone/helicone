import { TrashIcon } from "@heroicons/react/24/outline";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { Database } from "../../../supabase/database.types";
import useNotification from "../../shared/notification/useNotification";
import ThemedModal from "../../shared/themed/themedModal";

interface OrgMemberItemProps {
  index: number;
  orgMember: {
    email: string | undefined;
    member: string | undefined;
    isOwner: boolean;
    org_role: string | undefined;
  };
  orgId: string;
  refetch: () => void;
  refreshOrgs: () => void;
}

const OrgMemberItem = (props: OrgMemberItemProps) => {
  const { index, orgMember, orgId, refetch, refreshOrgs } = props;

  const { setNotification } = useNotification();

  const [openDelete, setOpenDelete] = useState(false);

  const user = useUser();

  const router = useRouter();

  const supabaseClient = useSupabaseClient<Database>();

  const [memberRole, setMemberRole] = useState<string>(
    orgMember.org_role || "member"
  );

  const isUser = orgMember.member === user?.id;

  return (
    <>
      <li key={index} className="py-3 grid grid-cols-8 gap-2 items-center">
        <p className="truncate overflow-ellipsis col-span-4">
          {orgMember.email}
        </p>
        <select
          id="location"
          name="location"
          className="col-span-2 block w-fit rounded-md border-gray-300 py-1.5 pl-3 pr-8 items-center text-base focus:border-sky-500 hover:cursor-pointer focus:outline-none focus:ring-sky-500 sm:text-sm"
          onChange={async (e) => {
            fetch(`/api/organization/${orgId}/update_member`, {
              method: "PATCH",
              body: JSON.stringify({
                orgRole: e.target.value,
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
            setMemberRole(e.target.value);
          }}
          value={memberRole}
        >
          {["admin", "member"]?.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <div className="col-span-2 flex justify-end">
          {orgMember.isOwner ? (
            <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
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
                    router.push("/organizations");
                  });
              }}
            >
              <p className="hover:bg-gray-200 inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                Leave
              </p>
            </button>
          ) : (
            <button
              onClick={() => {
                setOpenDelete(true);
              }}
            >
              <p className="hover:bg-gray-200 inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                Remove
              </p>
            </button>
          )}
        </div>
      </li>
      <ThemedModal open={openDelete} setOpen={setOpenDelete}>
        <div className="flex flex-col space-y-4 sm:space-y-8 min-w-[25rem]">
          <div className="flex flex-col space-y-2">
            <p className="text-sm sm:text-md font-semibold text-gray-900">
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
              className="flex flex-row items-center rounded-md bg-white px-4 py-2 text-sm font-medium border border-gray-300 hover:bg-gray-50 text-gray-900 shadow-sm hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
            >
              Cancel
            </button>
            <button
              className="flex flex-row items-center rounded-md bg-red-500 px-4 py-2 text-sm font-medium border border-red-500 hover:bg-red-700 text-gray-50 shadow-sm  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
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
