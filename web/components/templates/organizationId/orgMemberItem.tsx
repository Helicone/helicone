import { TrashIcon } from "@heroicons/react/24/outline";
import useNotification from "../../shared/notification/useNotification";

interface OrgMemberItemProps {
  index: number;
  orgMember: {
    email: string | undefined;
    member: string | undefined;
  };
  orgId: string;
  refetch: () => void;
  deleteable?: boolean;
}

const OrgMemberItem = (props: OrgMemberItemProps) => {
  const { index, orgMember, orgId, refetch, deleteable = true } = props;

  const { setNotification } = useNotification();

  return (
    <li key={index} className="py-3 flex flex-row justify-between gap-2">
      <p className="truncate overflow-ellipsis">{orgMember.email}</p>
      {deleteable ? (
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
      ) : (
        <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
          Owner
        </span>
      )}
    </li>
  );
};

export default OrgMemberItem;
