import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import {
  ORGANIZATION_COLORS,
  ORGANIZATION_ICONS,
} from "../templates/organization/orgConstants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMemo } from "react";
import { useOrg } from "./org/organizationContext";
import clsx from "clsx";

type Organization = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export default function OrgMoreDropdown({
  ownedOrgs,
  memberOrgs,
  customerOrgs,
  createNewOrgHandler,
  currentOrgId,
  setCurrentOrg,
}: {
  ownedOrgs: Organization[];
  memberOrgs: Organization[];
  customerOrgs: Organization[];
  createNewOrgHandler: () => void;
  currentOrgId?: string;
  setCurrentOrg?: (orgId: string) => void;
}) {
  const orgContext = useOrg();
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
  const content = (
    <>
      {ownedOrgs && ownedOrgs.length > 0 && (
        <DropdownMenuGroup className="flex flex-col min-h-0">
          <DropdownMenuLabel className="text-xs font-semibold text-slate-500">
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
                  onSelect={
                    setCurrentOrg ? () => setCurrentOrg(org.id) : undefined
                  }
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
                    {org.id === currentOrgId && (
                      <CheckIcon className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </DropdownMenuItem>
              );
            })}
          </ScrollArea>
        </DropdownMenuGroup>
      )}
      {memberOrgs && memberOrgs.length > 0 && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuGroup className="flex flex-col min-h-0">
            <DropdownMenuLabel className="text-xs font-semibold text-slate-500">
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
                    onSelect={
                      setCurrentOrg ? () => setCurrentOrg(org.id) : undefined
                    }
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
                      {org.id === currentOrgId && (
                        <CheckIcon className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </ScrollArea>
          </DropdownMenuGroup>
        </>
      )}
      {customerOrgs && customerOrgs.length > 0 && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuGroup className="flex flex-col min-h-0">
            <DropdownMenuLabel className="text-xs font-semibold text-slate-500">
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
                    onSelect={
                      setCurrentOrg ? () => setCurrentOrg(org.id) : undefined
                    }
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
                      {org.id === currentOrgId && (
                        <CheckIcon className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </ScrollArea>
          </DropdownMenuGroup>
        </>
      )}
      {ownedOrgs.length + memberOrgs.length + customerOrgs.length > 1 && (
        <DropdownMenuSeparator />
      )}
      <DropdownMenuItem
        className="text-xs"
        onClick={() => createNewOrgHandler()}
      >
        <PlusIcon className="h-4 w-4 mr-2" />
        Create New Org
      </DropdownMenuItem>
    </>
  );

  return (
    <>
      {/* Mobile view */}
      <div className="sm:hidden">{content}</div>

      {/* Desktop view */}
      <div className="hidden sm:block w-full">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="p-2 hover:bg-transparent m-0 w-full h-auto outline-none focus-visible:outline-none flex justify-between items-center"
            >
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
                <div className="flex flex-col gap-1 items-start">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {orgContext?.currentOrg?.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium max-w-[10rem] truncate">
                    Switch Organization
                  </p>
                </div>
              </div>
              <ChevronsUpDownIcon className="h-[18px] w-[18px] text-slate-900 dark:text-slate-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="start"
            className="w-[15rem] ml-3 max-h-[90vh] flex flex-col"
          >
            {content}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
