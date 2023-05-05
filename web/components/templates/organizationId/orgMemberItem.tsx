import { TrashIcon } from "@heroicons/react/24/outline";
import { useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import useNotification from "../../shared/notification/useNotification";

interface OrgMemberItemProps {
  index: number;
  orgMember: {
    email: string | undefined;
    member: string | undefined;
    isOwner: boolean;
  };
  orgId: string;
  refetch: () => void;
  refreshOrgs: () => void;
}

const OrgMemberItem = (props: OrgMemberItemProps) => {
  const { index, orgMember, orgId, refetch, refreshOrgs } = props;

  const { setNotification } = useNotification();

  const user = useUser();

  const router = useRouter();

  const isUser = orgMember.member === user?.id;

  return (
    <li key={index} className="py-3 flex flex-row justify-between gap-2">
      <p className="truncate overflow-ellipsis">{orgMember.email}</p>
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
                  setNotification("Successfully left organization", "success");
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
              });
          }}
        >
          <TrashIcon className="h-6 w-6 bg-red-500 text-white p-1 rounded-md" />
        </button>
      )}
    </li>
  );
};

export default OrgMemberItem;
