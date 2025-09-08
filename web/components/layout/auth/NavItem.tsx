import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>> | null;
  current: boolean;
  featured?: boolean;
  subItems?: NavigationItem[];
  isNew?: boolean;
}

interface NavItemProps {
  link: NavigationItem;
  isCollapsed: boolean;
  isSubItem?: boolean;
  expandedItems: string[];
  toggleExpand: (name: string) => void;
  deep?: number;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({
  link,
  isCollapsed,
  isSubItem = false,
  expandedItems,
  toggleExpand,
  deep,
  onClick,
}) => {
  const hasSubItems = link.subItems && link.subItems.length > 0;

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Link
            href={hasSubItems ? link.subItems![0].href : link.href}
            className={cn(
              buttonVariants({
                variant: "ghost",
                size: "icon",
              }),
              "h-9 w-9",
              link.current &&
                "bg-blue-100 hover:bg-blue-100 dark:bg-blue-900/50 dark:hover:bg-blue-900/50",
            )}
          >
            {link.icon && (
              <link.icon
                className={cn(
                  "h-4 w-4 text-slate-500",
                  link.current && "text-blue-600 dark:text-blue-400",
                )}
              />
            )}
            <span className="sr-only">{link.name}</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          className="flex items-center gap-4 dark:bg-slate-800 dark:text-slate-200"
        >
          {link.name}
          {link.featured && (
            <span className="ml-auto text-muted-foreground">New</span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className={cn(isSubItem)}>
      <Link
        href={hasSubItems ? "#" : link.href}
        onClick={hasSubItems ? () => toggleExpand(link.name) : onClick}
        className={cn(
          hasSubItems
            ? "mt-[14px] flex items-center gap-0.5 pl-2 text-[11px] text-xs font-normal text-slate-400"
            : cn(
                buttonVariants({
                  variant: "ghost",
                  size: "xs",
                }),
                deep && deep > 1 ? "h-6" : "h-8",
                "w-full justify-start font-normal",
                "text-[12px] text-slate-500",
                link.current &&
                  "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900/50",
              ),
          "",
        )}
      >
        <div className="flex items-center">
          {link.icon && (
            <link.icon
              className={cn(
                "mr-2 h-3.5 w-3.5 text-slate-500",
                link.current && "text-blue-700 dark:text-blue-300",
              )}
            />
          )}
          {link.name}
          {link.isNew && (
            <div className="ml-2 animate-shine rounded-full border border-sky-500 bg-gradient-to-r from-sky-400 via-heliblue to-sky-400 bg-[length:200%_100%] px-1.5 text-[9px] font-semibold uppercase text-white">
              New
            </div>
          )}
        </div>
        {hasSubItems && (
          <ChevronDownIcon
            className={cn(
              "h-3 w-3 text-slate-400 transition-transform",
              !expandedItems.includes(link.name) && "-rotate-90",
            )}
          />
        )}
      </Link>
      {hasSubItems && expandedItems.includes(link.name) && (
        <div className="mt-1">
          {link.subItems!.map((subItem) => (
            <NavItem
              key={subItem.name}
              link={subItem}
              isCollapsed={isCollapsed}
              isSubItem={true}
              expandedItems={expandedItems}
              toggleExpand={toggleExpand}
              deep={deep ? deep + 1 : 1}
              onClick={onClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NavItem;
