import { useUser } from "@supabase/auth-helpers-react";
import { Database } from "../../../../supabase/database.types";
import {
  useGetOrgMembers,
  useGetOrgOwner,
} from "../../../../services/hooks/organizations";
import { useState } from "react";
import OrgMemberItem from "../orgMemberItem";
import { useOrg } from "../../../layout/org/organizationContext";
import AddMemberModal from "../addMemberModal";
import { cn } from "@/lib/utils";
import { ProFeatureWrapper } from "@/components/shared/ProBlockerComponents/ProFeatureWrapper";
import { Button } from "@/components/ui/button";

interface OrgMembersPageProps {
  org: Database["public"]["Tables"]["organization"]["Row"];
  wFull?: boolean;
}

const OrgMembersPage = (props: OrgMembersPageProps) => {
  const { org, wFull = false } = props;

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

  const members = data
    ? data
        .filter((d) => {
          // if the org is a customer org, remove all "owner" roles UNLESS the user is the owner
          if (orgContext?.currentOrg?.organization_type === "customer") {
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
      <div
        className={cn(
          "flex flex-col text-foreground space-y-8",
          wFull ? "w-full" : "max-w-2xl"
        )}
      >
        <div className="flex flex-col h-full space-y-4 w-full mt-8">
          <div className="flex flex-row justify-between items-center">
            <h3 className="font-semibold">Members</h3>

            <div className="flex flex-row space-x-4">
              <ProFeatureWrapper featureName="invite">
                <Button
                  onClick={() => setAddOpen(true)}
                  variant="default"
                  size="sm_sleek"
                >
                  add member +
                </Button>
              </ProFeatureWrapper>
            </div>
          </div>
          {isLoading || isOrgOwnerLoading ? (
            <ul className="flex flex-col space-y-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <li
                  key={index}
                  className="h-6 flex flex-row justify-between gap-2 bg-muted animate-pulse rounded-md"
                ></li>
              ))}
            </ul>
          ) : (
            <ul className="divide-y divide-border border-t">
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
