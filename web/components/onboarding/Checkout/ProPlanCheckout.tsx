import { useOrgOnboardingStore } from "@/store/onboardingStore";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Gift, Package, FlaskConical, ClipboardCheck } from "lucide-react";
import { CheckoutLayout } from "./CheckoutLayout";
import { ADDONS } from "@/utils/pricingConfigs";
import Image from "next/image";
import { useDraftOnboardingStore } from "@/services/hooks/useOrgOnboarding";
import { useOrg } from "@/components/layout/org/organizationContext";

export const ProPlanCheckout = ({
  clientSecret,
}: {
  clientSecret: string | null;
}) => {
  const org = useOrg();
  const { draftAddons, setDraftAddons } = useDraftOnboardingStore(
    org?.currentOrg?.id ?? ""
  )();

  const handleAddAll = () => {
    setDraftAddons({
      prompts: true,
      experiments: true,
      evals: true,
    });
  };

  return (
    <CheckoutLayout
      clientSecret={clientSecret}
      header={<></>}
      leftPanel={
        <Card className="w-full rounded-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 p-6 bg-slate-100">
            <div className="flex items-center gap-2 w-full h-full">
              <div className="flex items-center justify-center rounded-md bg-card shadow bg-white border border-slate-200">
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
                  <h3 className="text-lg font-semibold text-slate-900 ">
                    Helicone Pro
                  </h3>
                  <div className="flex items-center gap-1">
                    <Gift className="h-4 w-4 text-slate-500" />
                    <span className="text-sdm text-slate-500">Add-ons</span>
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
          <div className="border-t p-6">
            <div className="flex flex-col gap-3">
              {ADDONS.map((addon) => (
                <div key={addon.id} className="flex items-center gap-4">
                  <Switch
                    variant="helicone"
                    checked={draftAddons[addon.id]}
                    onCheckedChange={(checked) =>
                      setDraftAddons({
                        ...draftAddons,
                        [addon.id]: checked,
                      })
                    }
                  />
                  <div className="flex flex-col gap-1.5">
                    <h4 className="text-sm font-medium">{addon.name}</h4>
                    <p className="text-sm text-slate-500">
                      {addon.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-100 py-3 px-6">
            <p className="text-sm text-slate-500 text-center">
              All features are included in the trial!
            </p>
          </div>
        </Card>
      }
    />
  );
};
