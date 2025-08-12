import { useOrg } from "@/components/layout/org/organizationContext";
import { MembersTable, MemberRole } from "@/components/onboarding/MembersTable";
import { useDraftOnboardingStore } from "@/services/hooks/useOrgOnboarding";
import { useHeliconeAuthClient } from "@/packages/common/auth/client/AuthClientFactory";

export const MembersStep = () => {
  const orgId = useOrg()?.currentOrg?.id ?? "";
  const { draftMembers, setDraftMembers } = useDraftOnboardingStore(orgId)();
  const { user } = useHeliconeAuthClient();
  const ownerEmail = user?.email ?? "";

  const handleAddMember = (email: string, role: MemberRole) => {
    const exists = draftMembers.some((member) => member.email === email);
    if (exists) return;

    setDraftMembers([...draftMembers, { email, role }]);
  };

  const handleRemoveMember = (email: string) => {
    setDraftMembers(draftMembers.filter((member) => member.email !== email));
  };

  return (
    <div className="flex flex-col gap-4">
      <MembersTable
        members={draftMembers}
        onAddMember={handleAddMember}
        onRemoveMember={handleRemoveMember}
        ownerEmail={ownerEmail}
      />
    </div>
  );
};
