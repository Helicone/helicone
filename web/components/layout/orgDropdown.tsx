import { signOut } from "@/components/shared/utils/utils";
import { Button } from "@/components/ui/button";
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
import { Database } from "@/supabase/database.types";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
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
import { useOrg } from "./org/organizationContext";
import OrgMoreDropdown from "./orgMoreDropdown";

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

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex flex-row gap-2 justify-start px-2 py-2 h-full w-full "
          >
            <div className="flex flex-col gap-1">
              <div className="flex flex-row gap-2 items-center">
                {currentIcon && (
                  <currentIcon.icon
                    className={clsx(
                      `text-${currentColor?.name}-500`,
                      "flex-shrink-0 h-4 w-4"
                    )}
                    aria-hidden="true"
                  />
                )}
                <h3 className="text-sm font-medium text-left truncate max-w-24">
                  {orgContext?.currentOrg?.name}
                </h3>
              </div>

              <p className="ml-6 text-xs text-slate-400 font-medium max-w-[6rem] truncate">
                {user?.email}
              </p>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[15rem] ml-2 mt-2 max-h-[90vh] flex flex-col border-slate-200">
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
              <DropdownMenuItem asChild className="cursor-pointer text-xs">
                <Link href="/settings/members">Invite members</Link>
              </DropdownMenuItem>
            )}
            {orgContext?.currentOrg?.tier !== "demo" && (
              <DropdownMenuItem asChild className="cursor-pointer text-xs">
                <Link href="/settings/members" className="flex flex-row gap-2 ">
                  <span>Billing</span>
                  {orgContext?.currentOrg?.tier === "free" ? (
                    <span className="text-xs text-sky-500 bg-sky-50 px-2 py-[2px] rounded-md font-semibold">
                      Upgrade
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-[2px] rounded-md font-semibold">
                      Enterprise
                    </span>
                  )}
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
    </>
  );
}
