import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useUpdateOrgMutation } from "@/services/hooks/organizations";
import { useUser } from "@supabase/auth-helpers-react";
import { useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "../../../../services/hooks/localStorage";
import { Database } from "../../../../supabase/database.types";
import { clsx } from "../../../shared/clsx";
import { DeleteOrgModal } from "../deleteOrgModal";
import { useIsGovernanceEnabled } from "../hooks";
import { ORGANIZATION_COLORS, ORGANIZATION_ICONS } from "../orgConstants";
import OrgMembersPage from "../members/orgMembersPage";
import { Separator } from "@/components/ui/separator";
import { CopyIcon } from "lucide-react";
import useNotification from "@/components/shared/notification/useNotification";

interface OrgSettingsPageProps {
  org: Database["public"]["Tables"]["organization"]["Row"];
  variant?: "organization" | "reseller";
}

const OrgSettingsPage = (props: OrgSettingsPageProps) => {
  const { org, variant = "organization" } = props;
  const user = useUser();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [, setOpenDemo] = useLocalStorage("openDemo", false);
  const [, setRemovedDemo] = useLocalStorage("removedDemo", false);

  const isGovernanceEnabled = useIsGovernanceEnabled();

  const isOwner = org.owner === user?.id;

  const currentUsage = 0;

  const isUnlimited = useMemo(() => {
    return (
      isGovernanceEnabled.data?.data?.data?.governance_settings?.limitUSD === 0
    );
  }, [isGovernanceEnabled.data?.data?.data?.governance_settings?.limitUSD]);

  const totalUsage = useMemo(() => {
    return (
      (isGovernanceEnabled.data?.data?.data?.governance_settings
        ?.limitUSD as number) ?? 0
    );
  }, [isGovernanceEnabled.data?.data?.data?.governance_settings?.limitUSD]);

  const days = useMemo(() => {
    return isGovernanceEnabled.data?.data?.data?.governance_settings
      ?.days as number;
  }, [isGovernanceEnabled.data?.data?.data?.governance_settings?.days]);

  const updateOrgMutation = useUpdateOrgMutation();

  const [debouncedOrgName, setDebouncedOrgName] = useState(org.name);

  useEffect(() => {
    if (debouncedOrgName === org.name) return;
    const timeout = setTimeout(() => {
      updateOrgMutation.mutate({
        orgId: org.id,
        name: debouncedOrgName,
        color: org.color,
        icon: org.icon,
        variant: variant,
      });
    }, 500);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedOrgName]);

  const { setNotification } = useNotification();

  return (
    <>
      <div className="py-4 flex flex-col text-gray-900 dark:text-gray-100 w-full max-w-2xl space-y-8">
        {isGovernanceEnabled.data?.data?.data && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex flex-col space-y-2">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Organization Governance
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  This organization is governed by your system administrator
                  with a maximum monthly spend limit of $
                  {totalUsage?.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  .
                </p>
              </div>

              <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
                <span>
                  Current Usage: $
                  {currentUsage.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                {isUnlimited ? (
                  <span>Unlimited</span>
                ) : (
                  <span>
                    $
                    {totalUsage.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    limit
                  </span>
                )}
              </div>
              <Progress
                value={(currentUsage / totalUsage) * 100}
                className={clsx(
                  "h-2",
                  isUnlimited
                    ? "bg-green-500"
                    : currentUsage / totalUsage > 0.9
                    ? "bg-red-500"
                    : currentUsage / totalUsage > 0.7
                    ? "bg-yellow-500"
                    : "bg-green-500"
                )}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Usage resets every {days} days
              </p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="org-id">Organization Id</Label>
            <div className="flex flex-row gap-2 items-center">
              <Input
                id="org-id"
                value={org.id}
                className="max-w-[450px] hover:cursor-pointer"
                disabled
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(org.id);
                  setNotification("Copied to clipboard", "success");
                }}
              >
                <CopyIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input
              id="org-name"
              value={debouncedOrgName}
              onChange={(e) => setDebouncedOrgName(e.target.value)}
              className="max-w-[450px]"
            />
          </div>

          <div className="space-y-6 max-w-[450px]">
            <div className="space-y-4">
              <Label>Choose a color</Label>
              <RadioGroup
                defaultValue={org.color}
                onValueChange={(value) =>
                  updateOrgMutation.mutate({
                    orgId: org.id,
                    color: value,
                    name: debouncedOrgName,
                    icon: org.icon,
                    variant: variant,
                  })
                }
                className="flex items-center justify-between px-8"
              >
                {ORGANIZATION_COLORS.map((color) => (
                  <div key={color.name} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={color.name}
                      id={color.name}
                      className="sr-only"
                    />
                    <label
                      htmlFor={color.name}
                      className={clsx(
                        "h-8 w-8 rounded-full cursor-pointer",
                        "ring-offset-2 transition-all",
                        "hover:ring-2 hover:ring-offset-2 hover:ring-sky-300 dark:hover:ring-sky-700",
                        org.color === color.name &&
                          "ring-2 ring-offset-2 ring-sky-300 dark:ring-sky-700",
                        color.bgColor,
                        "border border-black/10 dark:border-white/10"
                      )}
                    />
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <Label>Choose an icon</Label>
              <RadioGroup
                defaultValue={org.icon}
                onValueChange={(value) =>
                  updateOrgMutation.mutate({
                    orgId: org.id,
                    icon: value,
                    name: org.name,
                    color: org.color,
                    variant: variant,
                  })
                }
                className="grid grid-cols-5 gap-4"
              >
                {ORGANIZATION_ICONS.map((icon) => (
                  <div key={icon.name} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={icon.name}
                      id={icon.name}
                      className="sr-only"
                    />
                    <label
                      htmlFor={icon.name}
                      className={clsx(
                        "p-2 rounded-md cursor-pointer",
                        "flex items-center justify-center",
                        "ring-1 transition-all",
                        org.icon === icon.name
                          ? "ring-2 ring-offset-1 ring-sky-300 dark:ring-sky-700"
                          : "ring-gray-200 dark:ring-gray-800",
                        "bg-white dark:bg-black"
                      )}
                    >
                      {
                        <icon.icon className="h-6 w-6 text-black dark:text-white" />
                      }
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
          <OrgMembersPage org={org} wFull />

          <div className="flex justify-end max-w-[450px]"></div>
        </div>

        <Separator className="my-4" />

        <div className="flex space-y-4 items-center justify-between">
          {isOwner && (
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              Delete Organization
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              setOpenDemo(true);
              setRemovedDemo(false);
              window.location.reload();
            }}
          >
            Launch Demo Widget (Reload) 🚀
          </Button>
        </div>
      </div>
      <DeleteOrgModal
        open={deleteOpen}
        setOpen={setDeleteOpen}
        orgId={org.id}
        onDeleteRoute={"/dashboard"}
        orgName={org.name}
      />
    </>
  );
};

export default OrgSettingsPage;
