import { useTheme } from "next-themes";
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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Database } from "@/supabase/database.types";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useCallback, useMemo, useState } from "react";
import { clsx } from "../shared/clsx";
import AddMemberModal from "../templates/organization/addMemberModal";
import CreateOrgForm from "../templates/organization/createOrgForm";
import { useOrg } from "./org/organizationContext";
import {
  ORGANIZATION_COLORS,
  ORGANIZATION_ICONS,
} from "../templates/organization/orgConstants";
import { LogOutIcon } from "lucide-react";
import Link from "next/link";
import OrgMoreDropdown from "./orgMoreDropdown";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";

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
        org => org.owner === user?.id && org.organization_type !== "customer"
      ) || [];
    const member =
      orgContext?.allOrgs.filter(
        org => org.owner !== user?.id && org.organization_type !== "customer"
      ) || [];
    const customer =
      orgContext?.allOrgs.filter(org => org.organization_type === "customer") ||
      [];
    return { ownedOrgs: owned, memberOrgs: member, customerOrgs: customer };
  }, [orgContext?.allOrgs, user?.id]);

  const currentIcon = useMemo(
    () =>
      ORGANIZATION_ICONS.find(
        icon => icon.name === orgContext?.currentOrg?.icon
      ),
    [orgContext?.currentOrg?.icon]
  );

  const currentColor = useMemo(
    () =>
      ORGANIZATION_COLORS.find(
        icon => icon.name === orgContext?.currentOrg?.color
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

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex flex-row gap-2 justify-start px-2 py-1 w-full "
          >
            {currentIcon && (
              <currentIcon.icon
                className={clsx(
                  `text-${currentColor?.name}-500`,
                  "flex-shrink-0 h-4 w-4"
                )}
                aria-hidden="true"
              />
            )}
            <h3 className="text-xs font-medium text-left truncate max-w-24">
              {orgContext?.currentOrg?.name}
            </h3>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[15rem] ml-2 mt-2 max-h-[90vh] flex flex-col border-slate-200">
          <DropdownMenuLabel className="flex justify-between items-center">
            <div className="flex gap-2">
              {currentIcon && (
                <currentIcon.icon
                  className={clsx(
                    `text-${currentColor?.name}-500`,
                    "mt-1 flex-shrink-0 h-4 w-4"
                  )}
                  aria-hidden="true"
                />
              )}
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {orgContext?.currentOrg?.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium max-w-[10rem] truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <div className="hidden sm:block">
              <OrgMoreDropdown
                ownedOrgs={ownedOrgs}
                memberOrgs={memberOrgs}
                customerOrgs={customerOrgs}
                createNewOrgHandler={createNewOrgHandler}
                currentOrgId={orgContext?.currentOrg?.id}
                setCurrentOrg={orgContext?.setCurrentOrg}
              />
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="block sm:hidden">
            <OrgMoreDropdown
              ownedOrgs={ownedOrgs}
              memberOrgs={memberOrgs}
              customerOrgs={customerOrgs}
              createNewOrgHandler={createNewOrgHandler}
              currentOrgId={orgContext?.currentOrg?.id}
              setCurrentOrg={orgContext?.setCurrentOrg}
            />
            <DropdownMenuSeparator />
          </div>
          <DropdownMenuGroup>
            {orgContext?.currentOrg?.tier !== "demo" && (
              <DropdownMenuItem asChild className="cursor-pointer text-xs">
                <Link href="/settings/members">Invite members</Link>
              </DropdownMenuItem>
            )}
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
            onSuccess={orgId => {
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
    </>
  );
}
