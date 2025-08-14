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
    org?.currentOrg?.id ?? "",
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
        <Card className="w-full overflow-hidden rounded-lg">
          {/* Header */}
          <div className="flex items-center gap-2 bg-[hsl(var(--muted))] p-6">
            <div className="flex h-full w-full items-center gap-2">
              <div className="flex items-center justify-center rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow">
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

              <div className="flex w-full flex-row">
                <div className="flex w-full flex-col items-start justify-between">
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
          <div className="bg-[hsl(var(--muted))] px-6 py-3">
            <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
              All features are included in the trial!
            </p>
          </div>
        </Card>
      }
    >
      {isUpdating && !clientSecret && (
        <Card className="flex h-[600px] w-full items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[hsl(var(--primary))]"></div>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Updating checkout...
            </p>
          </div>
        </Card>
      )}
    </CheckoutLayout>
  );
};
