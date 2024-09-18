import { useTheme } from "@/components/shared/theme/themeContext";
import { signOut } from "@/components/shared/utils/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Database } from "@/supabase/database.types";
import { CheckIcon } from "@heroicons/react/24/outline";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useCallback, useMemo, useState } from "react";
import { clsx } from "../shared/clsx";
import AddMemberModal from "../templates/organization/addMemberModal";
import CreateOrgForm, {
  ORGANIZATION_COLORS,
  ORGANIZATION_ICONS,
} from "../templates/organization/createOrgForm";
import { useOrg } from "./organizationContext";

interface OrgDropdownProps {}

export default function OrgDropdown({}: OrgDropdownProps) {
  const orgContext = useOrg();
  const user = useUser();
  const [createOpen, setCreateOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const router = useRouter();
  const supabaseClient = useSupabaseClient<Database>();
  const themeContext = useTheme();

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
    themeContext?.setTheme(themeContext.theme === "dark" ? "light" : "dark");
  }, [themeContext]);

  const handleSignOut = useCallback(() => {
    signOut(supabaseClient).then(() => router.push("/"));
  }, [supabaseClient, router]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="justify-between ml-2 w-full">
            <div className="flex items-center w-full">
              {currentIcon && (
                <currentIcon.icon
                  className={clsx(
                    `text-${currentColor?.name}-500`,
                    "mr-3 flex-shrink-0 h-4 w-4"
                  )}
                  aria-hidden="true"
                />
              )}
              <p className="text-sm font-semibold truncate w-fit max-w-[7.25rem] text-left">
                {orgContext?.currentOrg?.name}
              </p>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[15rem] ml-2 mt-1 max-h-[90vh] flex flex-col">
          <DropdownMenuLabel>Organizations</DropdownMenuLabel>
          <div className="flex-grow flex flex-col overflow-hidden">
            {ownedOrgs && ownedOrgs.length > 0 && (
              <div className="flex flex-col min-h-0">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Your Organizations
                  {ownedOrgs.length > 7 && ` (${ownedOrgs.length})`}
                </DropdownMenuLabel>
                <ScrollArea className="flex-grow overflow-y-auto">
                  {ownedOrgs.map((org, idx) => {
                    const icon = ORGANIZATION_ICONS.find(
                      (icon) => icon.name === org.icon
                    );
                    return (
                      <DropdownMenuItem
                        key={idx}
                        onSelect={() => orgContext?.setCurrentOrg(org.id)}
                      >
                        <div className="flex items-center justify-between w-full">
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
            )}
            {memberOrgs && memberOrgs.length > 0 && (
              <div className="flex flex-col min-h-0">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Member Organizations
                  {memberOrgs.length > 7 && ` (${memberOrgs.length})`}
                </DropdownMenuLabel>
                <ScrollArea className="flex-grow overflow-y-auto">
                  {memberOrgs.map((org, idx) => {
                    const icon = ORGANIZATION_ICONS.find(
                      (icon) => icon.name === org.icon
                    );
                    return (
                      <DropdownMenuItem
                        key={idx}
                        onSelect={() => orgContext?.setCurrentOrg(org.id)}
                      >
                        <div className="flex items-center justify-between w-full">
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
            )}
            {customerOrgs && customerOrgs.length > 0 && (
              <div className="flex flex-col min-h-0">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Customers
                  {customerOrgs.length > 7 && ` (${customerOrgs.length})`}
                </DropdownMenuLabel>
                <ScrollArea className="flex-grow overflow-y-auto">
                  {customerOrgs.map((org, idx) => {
                    const icon = ORGANIZATION_ICONS.find(
                      (icon) => icon.name === org.icon
                    );
                    return (
                      <DropdownMenuItem
                        key={idx}
                        onSelect={() => orgContext?.setCurrentOrg(org.id)}
                      >
                        <div className="flex items-center justify-between w-full">
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
            )}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => createNewOrgHandler()}>
            Create New Org
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>User Settings</DropdownMenuLabel>
          <DropdownMenuItem
            className={cn("hover:bg-transparent cursor-default")}
            disableHover
            disableClickClose
          >
            <div className="flex items-center justify-between w-full">
              <span>Theme</span>
              <Switch
                checked={themeContext?.theme === "dark"}
                onCheckedChange={handleThemeChange}
              />
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem disableHover>
            <div className="flex items-center justify-between w-full">
              <span className="text-sm text-muted-foreground truncate">
                {user?.email}
              </span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleSignOut}>Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <CreateOrgForm onCancelHandler={setCreateOpen} />
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
