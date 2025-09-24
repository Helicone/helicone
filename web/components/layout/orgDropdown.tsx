import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useHeliconeAuthClient } from "@/packages/common/auth/client/AuthClientFactory";
import { getTierDisplayInfo } from "@/utils/pricingConfigs";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { LogOutIcon } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useMemo, useState } from "react";
import { clsx } from "../shared/clsx";
import AddMemberModal from "../templates/organization/addMemberModal";
import CreateOrgForm from "../templates/organization/createOrgForm";
import {
  ORGANIZATION_COLORS,
  ORGANIZATION_ICONS,
} from "../templates/organization/orgConstants";
import { UpgradeProDialog } from "../templates/organization/plan/upgradeProDialog";
import { useOrg } from "./org/organizationContext";
import OrgMoreDropdown from "./orgMoreDropdown";
import Intercom from "@intercom/messenger-js-sdk";
import { INTERCOM_APP_ID } from "./SidebarHelpDropdown";

interface OrgDropdownProps {}

export default function OrgDropdown({}: OrgDropdownProps) {
  const orgContext = useOrg();

  const [createOpen, setCreateOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const router = useRouter();
  const heliconeAuthClient = useHeliconeAuthClient();
  const { setTheme, theme } = useTheme();

  const org = useOrg();

  const { ownedOrgs, memberOrgs, customerOrgs } = useMemo(() => {
    const owned =
      orgContext?.allOrgs.filter(
        (org) =>
          org.owner === heliconeAuthClient.user?.id &&
          org.organization_type !== "customer",
      ) || [];
    const member =
      orgContext?.allOrgs.filter(
        (org) =>
          org.owner !== heliconeAuthClient.user?.id &&
          org.organization_type !== "customer",
      ) || [];
    const customer =
      orgContext?.allOrgs.filter(
        (org) => org.organization_type === "customer",
      ) || [];
    return { ownedOrgs: owned, memberOrgs: member, customerOrgs: customer };
  }, [orgContext?.allOrgs, heliconeAuthClient.user?.id]);

  const currentIcon = useMemo(
    () =>
      ORGANIZATION_ICONS.find(
        (icon) => icon.name === orgContext?.currentOrg?.icon,
      ),
    [orgContext?.currentOrg?.icon],
  );

  const currentColor = useMemo(
    () =>
      ORGANIZATION_COLORS.find(
        (icon) => icon.name === orgContext?.currentOrg?.color,
      ),
    [orgContext?.currentOrg?.color],
  );

  const createNewOrgHandler = useCallback(() => {
    setCreateOpen(true);
  }, []);

  const handleThemeChange = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const handleSignOut = useCallback(() => {
    heliconeAuthClient.signOut().then(() => {
      Intercom({ app_id: INTERCOM_APP_ID, hide_default_launcher: true });
      router.push("/");
    });
  }, [heliconeAuthClient, router]);

  // Get tier display info from the centralized config
  const tierDisplayInfo = useMemo(() => {
    return getTierDisplayInfo(orgContext?.currentOrg?.tier);
  }, [orgContext?.currentOrg?.tier]);

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            className="flex w-full flex-row items-center justify-start gap-2 rounded-md px-2 py-1 text-sm transition-colors hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <div className="flex flex-row gap-2">
              {currentIcon && (
                <div className="flex items-center">
                  <currentIcon.icon
                    className={clsx(
                      `text-${currentColor?.name}-500`,
                      "h-5 w-5 flex-shrink-0",
                    )}
                    aria-hidden="true"
                  />
                </div>
              )}
              <div className="flex flex-col gap-1">
                <h3 className="max-w-24 truncate text-left text-sm font-medium">
                  {orgContext?.currentOrg?.name}
                </h3>
                <p className="max-w-[6rem] truncate text-xs font-medium text-slate-400">
                  {heliconeAuthClient.user?.email}
                </p>
              </div>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="ml-2 mt-2 flex max-h-[90vh] w-[15rem] flex-col border-slate-200">
          <DropdownMenuGroup>
            <OrgMoreDropdown
              ownedOrgs={ownedOrgs}
              memberOrgs={memberOrgs}
              customerOrgs={customerOrgs}
              createNewOrgHandler={createNewOrgHandler}
              currentOrgId={orgContext?.currentOrg?.id}
              setCurrentOrg={orgContext?.setCurrentOrg}
            />
            <DropdownMenuSeparator />
            {orgContext?.currentOrg?.tier !== "demo" && (
              <DropdownMenuItem
                className="cursor-pointer text-xs"
                onClick={() => {
                  if (orgContext?.currentOrg?.tier === "free") {
                    setUpgradeOpen(true);
                  } else {
                    setAddOpen(true);
                  }
                }}
              >
                Invite members
              </DropdownMenuItem>
            )}
            {orgContext?.currentOrg?.tier !== "demo" && (
              <DropdownMenuItem asChild className="cursor-pointer text-xs">
                <Link href="/settings/billing" className="flex flex-row gap-2">
                  <span>Billing</span>
                  <span className={tierDisplayInfo.className}>
                    {tierDisplayInfo.text}
                  </span>
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>

          <DropdownMenuGroup>
            <DropdownMenuItem
              className={cn("cursor-default hover:bg-transparent")}
              disableHover
              disableClickClose
            >
              <div className="flex w-full items-center justify-between text-xs">
                <span>Dark mode</span>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={handleThemeChange}
                  size="md"
                />
              </div>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />

          {orgContext?.currentOrg?.tier !== "demo" && (
            <Link href="/settings" rel="noopener noreferrer">
              <DropdownMenuItem className="text-xs">
                <Cog6ToothIcon className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
            </Link>
          )}

          <DropdownMenuItem onSelect={handleSignOut} className="text-xs">
            <LogOutIcon className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <CreateOrgForm
            onCancelHandler={setCreateOpen}
            onCloseHandler={() => setCreateOpen(false)}
            onSuccess={(orgId) => {
              orgContext?.setCurrentOrg(orgId ?? "");
              router.push("/dashboard");
            }}
          />
        </DialogContent>
      </Dialog>

      <AddMemberModal
        orgId={org?.currentOrg?.id || ""}
        orgOwnerId={org?.currentOrg?.owner || ""}
        open={addOpen}
        setOpen={setAddOpen}
      />
      <UpgradeProDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        featureName="invite"
      />
    </>
  );
}
