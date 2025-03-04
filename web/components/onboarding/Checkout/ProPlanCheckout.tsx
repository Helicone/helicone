import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Gift } from "lucide-react";
import { CheckoutLayout } from "./CheckoutLayout";
import { ADDONS } from "@/utils/pricingConfigs";
import Image from "next/image";
import { useDraftOnboardingStore } from "@/services/hooks/useOrgOnboarding";
import { useOrg } from "@/components/layout/org/organizationContext";
import { useState } from "react";

export const ProPlanCheckout = ({
  clientSecret,
}: {
  clientSecret: string | null;
}) => {
  const org = useOrg();
  const { draftAddons, setDraftAddons } = useDraftOnboardingStore(
    org?.currentOrg?.id ?? ""
  )();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleAddAll = () => {
    setIsUpdating(true);
    setDraftAddons({
      prompts: true,
      experiments: true,
      evals: true,
    });
  };

  const handleAddonChange = (addonId: string, checked: boolean) => {
    setIsUpdating(true);
    setDraftAddons({
      ...draftAddons,
      [addonId]: checked,
    });
  };

  return (
    <CheckoutLayout
      clientSecret={clientSecret}
      header={<></>}
      leftPanel={
        <Card className="w-full rounded-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 p-6 bg-[hsl(var(--muted))]">
            <div className="flex items-center gap-2 w-full h-full">
              <div className="flex items-center justify-center rounded-md bg-[hsl(var(--card))] shadow border border-[hsl(var(--border))]">
                <div className="flex h-12 w-12 items-center justify-center">
                  <Image
                    src="/static/logo-clear.png"
                    alt="Helicone Logo"
                    className="h-8 w-8 object-contain"
                    width={32}
                    height={32}
                  />
                </div>
              </div>

              <div className="flex flex-row w-full">
                <div className="flex flex-col items-start justify-between w-full">
                  <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                    Helicone Pro
                  </h3>
                  <div className="flex items-center gap-1">
                    <Gift className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    <span className="text-sm text-[hsl(var(--muted-foreground))]">
                      Add-ons
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-1">
                  <Button variant="outline" size="sm" onClick={handleAddAll}>
                    Add all
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="border-t border-[hsl(var(--border))] p-6">
            <div className="flex flex-col gap-3">
              {ADDONS.map((addon) => (
                <div key={addon.id} className="flex items-center gap-4">
                  <Switch
                    variant="helicone"
                    checked={draftAddons[addon.id]}
                    onCheckedChange={(checked) =>
                      handleAddonChange(addon.id, checked)
                    }
                  />
                  <div className="flex flex-col gap-1.5">
                    <h4 className="text-sm font-medium text-[hsl(var(--foreground))]">
                      {addon.name}
                    </h4>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      {addon.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-[hsl(var(--muted))] py-3 px-6">
            <p className="text-sm text-[hsl(var(--muted-foreground))] text-center">
              All features are included in the trial!
            </p>
          </div>
        </Card>
      }
    >
      {isUpdating && !clientSecret && (
        <Card className="h-[600px] w-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Updating checkout...
            </p>
          </div>
        </Card>
      )}
    </CheckoutLayout>
  );
};
