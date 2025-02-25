import { Input } from "@/components/ui/input";
import React, { useState } from "react";
import { useDraftOnboardingStore } from "@/services/hooks/useOrgOnboarding";
import { useOrg } from "@/components/layout/org/organizationContext";

export const OrganizationStep = () => {
  const orgId = useOrg()?.currentOrg?.id ?? "";
  const { draftName, setDraftName } = useDraftOnboardingStore(orgId)();
  const [error, setError] = useState("");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setDraftName(newName);

    if (!newName) {
      setError("Please enter an organization name :)");
    } else {
      setError("");
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-slate-800">Organization</h2>
        <Input
          type="text"
          value={draftName}
          onChange={handleNameChange}
          className={`text-sm ${error ? "border-red-500 text-red-500" : ""}`}
        />
        {error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : draftName ? (
          <p className="text-sm font-light text-slate-400">
            Don&apos;t worry, you can rename your organization later.
          </p>
        ) : null}
      </div>
    </div>
  );
};
