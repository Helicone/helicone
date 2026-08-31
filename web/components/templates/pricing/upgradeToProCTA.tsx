import { useOrg } from "@/components/layout/org/organizationContext";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import { ContactCTA, CONTACT_US_URL } from "./contactCTA";

/**
 * Self-serve plan upgrades have been removed. Paid orgs are sent to the
 * billing page; everyone else is sent to the contact page.
 */
export const UpgradeToProCTA = ({ showContactCTA = false }) => {
  const org = useOrg();

  const isPro = useMemo(() => {
    return (
      org?.currentOrg?.tier === "pro-20240913" ||
      org?.currentOrg?.tier === "pro-20250202" ||
      org?.currentOrg?.tier === "pro-20251210" ||
      org?.currentOrg?.tier === "team-20250130" ||
      org?.currentOrg?.tier === "team-20251210"
    );
  }, [org?.currentOrg?.tier]);

  return (
    <div>
      {showContactCTA && <ContactCTA />}
      <Button
        onClick={() => {
          window.open(isPro ? "/settings/billing" : CONTACT_US_URL, "_blank");
        }}
        className="mt-4 w-full"
      >
        {isPro ? "Manage billing" : "Contact us to upgrade"}
      </Button>
    </div>
  );
};
