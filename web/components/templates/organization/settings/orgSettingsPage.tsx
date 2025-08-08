import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useUpdateOrgMutation } from "@/services/hooks/organizations";
import { useEffect, useState } from "react";
import { useLocalStorage } from "../../../../services/hooks/localStorage";
import { Database } from "../../../../db/database.types";
import { clsx } from "../../../shared/clsx";
import { DeleteOrgModal } from "../deleteOrgModal";
import { ORGANIZATION_COLORS, ORGANIZATION_ICONS } from "../orgConstants";
import OrgMembersPage from "../members/orgMembersPage";
import { Separator } from "@/components/ui/separator";
import { CopyIcon } from "lucide-react";
import useNotification from "@/components/shared/notification/useNotification";
import { useHeliconeAuthClient } from "@/packages/common/auth/client/AuthClientFactory";
import { useOrg } from "../../../layout/org/organizationContext";
interface OrgSettingsPageProps {
  org: Database["public"]["Tables"]["organization"]["Row"];
  variant?: "organization" | "reseller";
}

const OrgSettingsPage = (props: OrgSettingsPageProps) => {
  const { org, variant = "organization" } = props;
  const { user } = useHeliconeAuthClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [, setOpenDemo] = useLocalStorage("openDemo", false);
  const [, setRemovedDemo] = useLocalStorage("removedDemo", false);
  const { setNotification } = useNotification();
  const orgContext = useOrg();

  const isOwner = org.owner === user?.id;

  const updateOrgMutation = useUpdateOrgMutation();

  const [debouncedOrgName, setDebouncedOrgName] = useState(org.name);

  const handleOrgUpdate = (updateData: {
    orgId: string;
    name: string;
    color: string;
    icon: string;
    variant: string;
  }) => {
    updateOrgMutation.mutate(updateData, {
      onSuccess: () => {
        orgContext?.refetchOrgs?.();
      },
    });
  };

  useEffect(() => {
    if (debouncedOrgName === org.name) return;
    const timeout = setTimeout(() => {
      handleOrgUpdate({
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

  return (
    <>
      <div className="flex w-full max-w-2xl flex-col space-y-8 text-gray-900 dark:text-gray-100">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="org-id">Organization Id</Label>
            <div className="flex flex-row items-center gap-2">
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

          <div className="flex max-w-[450px] flex-col gap-8">
            <div className="flex flex-col gap-6">
              <Label>Choose a color</Label>
              <RadioGroup
                defaultValue={org.color}
                onValueChange={(value) =>
                  handleOrgUpdate({
                    orgId: org.id,
                    color: value,
                    name: debouncedOrgName,
                    icon: org.icon,
                    variant: variant,
                  })
                }
                className="flex items-center justify-start"
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
                        "h-8 w-8 cursor-pointer rounded-full",
                        "ring-offset-2 transition-all",
                        "hover:ring-2 hover:ring-sky-300 hover:ring-offset-2 dark:hover:ring-sky-700",
                        org.color === color.name &&
                          "ring-2 ring-sky-300 ring-offset-2 dark:ring-sky-700",
                        color.bgColor,
                        "border border-black/10 dark:border-white/10",
                      )}
                    />
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex flex-col gap-4">
              <Label>Choose an icon</Label>
              <RadioGroup
                defaultValue={org.icon}
                onValueChange={(value) =>
                  handleOrgUpdate({
                    orgId: org.id,
                    icon: value,
                    name: org.name,
                    color: org.color,
                    variant: variant,
                  })
                }
                className="flex w-fit flex-wrap items-start gap-6"
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
                        "cursor-pointer rounded-md p-2",
                        "flex items-center justify-center",
                        "ring-1 transition-all",
                        org.icon === icon.name
                          ? "ring-2 ring-sky-300 ring-offset-1 dark:ring-sky-700"
                          : "ring-gray-200 dark:ring-gray-800",
                        "bg-white dark:bg-black",
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

          <div className="flex max-w-[450px] justify-end"></div>
        </div>

        <Separator className="my-4" />

        <div className="flex items-center justify-between space-y-4">
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
