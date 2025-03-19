import { signOut } from "@/components/shared/utils/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Database } from "@/db/database.types";
import { cn } from "@/lib/utils";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { CheckIcon, LogOutIcon, PlusIcon } from "lucide-react";
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
import { getTierDisplayInfo } from "@/utils/pricingConfigs";

interface OrgDropdownProps {}

export default function OrgDropdown({}: OrgDropdownProps) {
  const orgContext = useOrg();
  const user = useUser();
  const [createOpen, setCreateOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const router = useRouter();
  const supabaseClient = useSupabaseClient<Database>();
  const { setTheme, theme } = useTheme();

  const org = useOrg();

  const { ownedOrgs, memberOrgs, customerOrgs } = useMemo(() => {
    const owned =
      orgContext?.allOrgs.filter(
        (org) => org.owner === user?.id && org.organization_type !== "customer"
      ) || [];
    const member =
      orgContext?.allOrgs.filter(
        (org) => org.owner !== user?.id && org.organization_type !== "customer"
      ) || [];
    const customer =
      orgContext?.allOrgs.filter(
        (org) => org.organization_type === "customer"
      ) || [];
    return { ownedOrgs: owned, memberOrgs: member, customerOrgs: customer };
  }, [orgContext?.allOrgs, user?.id]);

  const currentIcon = useMemo(
    () =>
      ORGANIZATION_ICONS.find(
        (icon) => icon.name === orgContext?.currentOrg?.icon
      ),
    [orgContext?.currentOrg?.icon]
  );

  const currentColor = useMemo(
    () =>
      ORGANIZATION_COLORS.find(
        (icon) => icon.name === orgContext?.currentOrg?.color
      ),
    [orgContext?.currentOrg?.color]
  );

  const createNewOrgHandler = useCallback(() => {
    setCreateOpen(true);
  }, []);

  const handleThemeChange = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const handleSignOut = useCallback(() => {
    signOut(supabaseClient).then(() => router.push("/"));
  }, [supabaseClient, router]);

  // Get tier display info from the centralized config
  const tierDisplayInfo = useMemo(() => {
    return getTierDisplayInfo(orgContext?.currentOrg?.tier);
  }, [orgContext?.currentOrg?.tier]);

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="none"
            size="none"
            className="w-40 flex flex-row gap-2 items-center p-2 h-full bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-none"
          >
            {currentIcon && (
              <currentIcon.icon
                className={clsx(
                  `text-${currentColor?.name}-500`,
                  "shrink-0 h-6 w-6"
                )}
                aria-hidden="true"
              />
            )}
            <div className="w-28 flex flex-col">
              <h3 className="w-full text-sm font-medium text-left truncate">
                {orgContext?.currentOrg?.name}
              </h3>
              <p className="w-full text-xs font-light text-muted-foreground text-left truncate">
                {user?.email}
              </p>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[15rem] max-h-[90vh] flex flex-col border-slate-200"
          sideOffset={0}
          side="bottom"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs font-semibold text-slate-500">
              Your Organizations
              {ownedOrgs.length > 7 && ` (${ownedOrgs.length})`}
            </DropdownMenuLabel>
            {ownedOrgs && ownedOrgs.length > 0 && (
              <div className="h-[150px] max-h-[150px] overflow-hidden">
                <ScrollArea className="h-full w-full">
                  {ownedOrgs.map((org, idx) => {
                    const icon = ORGANIZATION_ICONS.find(
                      (icon) => icon.name === org.icon
                    );
                    return (
                      <DropdownMenuItem
                        key={idx}
                        onSelect={() => orgContext?.setCurrentOrg(org.id)}
                      >
                        <div className="flex items-center justify-between w-full text-xs">
                          <div className="flex items-center space-x-2">
                            {icon && (
                              <icon.icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                            )}
                            <span className="truncate max-w-[7.5rem]">
                              {org.name}
                            </span>
                          </div>
                          {org.id === orgContext?.currentOrg?.id && (
                            <CheckIcon className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                </ScrollArea>
              </div>
            )}
            <DropdownMenuItem
              className="text-xs cursor-pointer"
              onClick={createNewOrgHandler}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create New Org
            </DropdownMenuItem>

            {memberOrgs && memberOrgs.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-semibold text-slate-500">
                  Member Organizations
                  {memberOrgs.length > 7 && ` (${memberOrgs.length})`}
                </DropdownMenuLabel>
                <div className="h-[150px] max-h-[150px] overflow-hidden">
                  <ScrollArea className="h-full w-full">
                    {memberOrgs.map((org, idx) => {
                      const icon = ORGANIZATION_ICONS.find(
                        (icon) => icon.name === org.icon
                      );
                      return (
                        <DropdownMenuItem
                          key={idx}
                          onSelect={() => orgContext?.setCurrentOrg(org.id)}
                        >
                          <div className="flex items-center justify-between w-full text-xs">
                            <div className="flex items-center space-x-2">
                              {icon && (
                                <icon.icon className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="truncate max-w-[7.5rem]">
                                {org.name}
                              </span>
                            </div>
                            {org.id === orgContext?.currentOrg?.id && (
                              <CheckIcon className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                  </ScrollArea>
                </div>
              </>
            )}

            {customerOrgs && customerOrgs.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-semibold text-slate-500">
                  Customers
                  {customerOrgs.length > 7 && ` (${customerOrgs.length})`}
                </DropdownMenuLabel>
                <div className="h-[150px] max-h-[150px] overflow-hidden">
                  <ScrollArea className="h-full w-full">
                    {customerOrgs.map((org, idx) => {
                      const icon = ORGANIZATION_ICONS.find(
                        (icon) => icon.name === org.icon
                      );
                      return (
                        <DropdownMenuItem
                          key={idx}
                          onSelect={() => orgContext?.setCurrentOrg(org.id)}
                        >
                          <div className="flex items-center justify-between w-full text-xs">
                            <div className="flex items-center space-x-2">
                              {icon && (
                                <icon.icon className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="truncate max-w-[7.5rem]">
                                {org.name}
                              </span>
                            </div>
                            {org.id === orgContext?.currentOrg?.id && (
                              <CheckIcon className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                  </ScrollArea>
                </div>
              </>
            )}

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
                <Link href="/settings/billing" className="flex flex-row gap-2 ">
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
              className={cn("hover:bg-transparent cursor-default")}
              disableHover
              disableClickClose
            >
              <div className="flex items-center justify-between w-full text-xs">
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
                <Cog6ToothIcon className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
            </Link>
          )}

          <DropdownMenuItem onSelect={handleSignOut} className="text-xs">
            <LogOutIcon className="h-4 w-4 mr-2" />
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
