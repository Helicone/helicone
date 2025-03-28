import React from "react";
import OrganizationLookup from "./OrganizationLookup";
import TopOrganizations from "./TopOrganizations";

const OrgAnalytics = () => {
  return (
    <article className="flex flex-col gap-6 w-full rounded-lg">
      <TopOrganizations />
      <OrganizationLookup />
    </article>
  );
};

export default OrgAnalytics;
