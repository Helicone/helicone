import { useUser } from "@supabase/auth-helpers-react";
import { Database } from "../../../../supabase/database.types";
import {
  useGetOrgMembers,
  useGetOrgOwner,
} from "../../../../services/hooks/organizations";
import { useState } from "react";
import OrgMemberItem from "../orgMemberItem";
import { useOrg } from "../../../shared/layout/organizationContext";
import AddMemberModal from "../addMemberModal";

interface OrgMembersPageProps {
  org: Database["public"]["Tables"]["organization"]["Row"];
}

const OrgMembersPage = (props: OrgMembersPageProps) => {
  const { org } = props;

  const { data, isLoading, refetch } = useGetOrgMembers(org.id);

  const { data: orgOwner, isLoading: isOrgOwnerLoading } = useGetOrgOwner(
    org.id
  );

  const orgContext = useOrg();

  const user = useUser();

  const [addOpen, setAddOpen] = useState(false);

  const onLeaveSuccess = () => {
    const ownedOrgs = orgContext?.allOrgs.filter(
      (org) => org.owner === user?.id
    );
    if (orgContext && ownedOrgs && ownedOrgs.length > 0) {
      orgContext.refetchOrgs();
      orgContext.setCurrentOrg(ownedOrgs[0].id);
    }
  };

  const isOwner = org.owner === user?.id;

  const members = data?.data
    ? data?.data
        .filter((d) => {
          // if the org is a customer org, remove all "owner" roles UNLESS the user is the owner
          if (orgContext?.currentOrg?.owner === user?.id) {
            return true;
          } else if (orgContext?.currentOrg?.organization_type === "customer") {
            return d.org_role !== "owner";
          } else {
            return true;
          }
        })
        .map((d) => {
          return {
            ...d,
            org_role: d.org_role === "owner" ? "admin" : d.org_role,
            isOwner: d.org_role === "owner",
          };
        })
    : [];

  const isUserAdmin =
    isOwner || members.find((m) => m.member === user?.id)?.org_role === "admin";

  return (
    <>
      <div className="flex flex-col text-gray-900 dark:text-gray-100 max-w-2xl space-y-8">
        <div className="flex flex-col h-full space-y-4 w-full mt-8">
          <div className="flex flex-row justify-between items-center">
            <h3 className="text-lg font-semibold">Members</h3>

            <div className="flex flex-row space-x-4">
              <button
                onClick={() => {
                  setAddOpen(true);
                }}
                className="items-center rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Invite Members
              </button>
            </div>
          </div>
          {isLoading || isOrgOwnerLoading ? (
            <ul className="flex flex-col space-y-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <li
                  key={index}
                  className="h-6 flex flex-row justify-between gap-2 bg-gray-500 animate-pulse rounded-md"
                ></li>
              ))}
            </ul>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-800 border-t border-gray-200 dark:border-gray-800">
              {members.map((member, index) => (
                <OrgMemberItem
                  key={index}
                  index={index}
                  orgMember={member}
                  orgId={org.id}
                  refetch={refetch}
                  isUserAdmin={isUserAdmin}
                  refreshOrgs={onLeaveSuccess}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
      <AddMemberModal
        orgId={org.id}
        orgOwnerId={org.owner}
        open={addOpen}
        setOpen={setAddOpen}
        onSuccess={() => {
          refetch();
        }}
      />
    </>
  );
};

export default OrgMembersPage;
