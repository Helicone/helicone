import { Helmet } from "react-helmet-async";
import DeveloperPage from "../developer/developerPage";
import VaultPage from "@/components/templates/vault/vaultPage";
import { useOrg } from "@/components/layout/org/organizationContext";
import { ContactUsSection } from "@/components/templates/developer/DeveloperShell";

export default function VaultShell() {
  const orgContext = useOrg();
  const tier = orgContext?.currentOrg?.tier;
  const isPaidPlan = tier !== "free";

  return (
    <>
      <Helmet>
        <title>Developer Vault | Helicone</title>
      </Helmet>
      <DeveloperPage title="Developer Vault">
        {isPaidPlan ? <VaultPage /> : <ContactUsSection feature="vault" />}
      </DeveloperPage>
    </>
  );
}
