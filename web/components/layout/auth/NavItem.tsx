import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";
import Link from "next/link";

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
  item: NavigationItem;
  isCollapsed: boolean;
  isSubItem?: boolean;
  isExpanded: boolean;
  toggleExpand: (name: string) => void;
  deep?: number;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({
  item,
  isCollapsed,
  isSubItem = false,
  isExpanded,
  toggleExpand,
  deep = 0,
  onClick,
}) => {
  const hasSubItems = item.subItems && item.subItems.length > 0;

  const href = hasSubItems ? item.subItems![0].href : item.href;

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Link
            href={href}
            className={cn(
              buttonVariants({
                variant: "ghost",
                size: "icon",
              }),
              "h-9 w-9",
              item.current && "bg-accent hover:bg-accent"
            )}
          >
            {item.icon && (
              <item.icon
                className={cn(
                  "h-4 w-4 text-slate-500",
                  item.current && "text-slate-800 dark:text-slate-200"
                )}
              />
            )}
            <span className="sr-only">{item.name}</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          className="flex items-center gap-4 dark:bg-slate-800 dark:text-slate-200"
        >
          {item.name}
          {item.featured && (
            <span className="ml-auto text-muted-foreground">New</span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  // For parent items with subitems, we use a button to toggle expansion
  if (hasSubItems) {
    return (
      <div className={cn(isSubItem)}>
        <button
          onClick={() => toggleExpand(item.name)}
          className={cn(
            "flex items-center gap-0.5 text-slate-400 text-xs mt-[14px] text-[11px] font-normal pl-2 w-full"
          )}
        >
          <div className="flex items-center">
            {item.icon && (
              <item.icon
                className={cn(
                  "mr-2 h-3.5 w-3.5 text-slate-500",
                  item.current && "text-slate-800 dark:text-slate-200"
                )}
              />
            )}
            {item.name}
            {item.isNew && (
              <div className="uppercase text-[9px] font-semibold border bg-gradient-to-r from-sky-400 via-heliblue to-sky-400 border-sky-500 px-1.5 rounded-full text-white ml-2 animate-shine bg-[length:200%_100%]">
                New
              </div>
            )}
          </div>
          <ChevronDownIcon
            className={cn(
              "h-3 w-3 transition-transform text-slate-400",
              !isExpanded && "-rotate-90"
            )}
          />
        </button>
        {isExpanded && (
          <div className="mt-1">
            {item.subItems!.map((subItem) => (
              <NavItem
                key={subItem.name}
                item={subItem}
                isCollapsed={isCollapsed}
                isSubItem={true}
                isExpanded={false}
                toggleExpand={toggleExpand}
                deep={deep + 1}
                onClick={onClick}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Regular navigation items just use a Link
  return (
    <div className={cn(isSubItem)}>
      <Link
        href={item.href}
        className={cn(
          buttonVariants({
            variant: item.current ? "secondary" : "ghost",
            size: "xs",
          }),
          deep > 1 ? "h-6" : "h-8",
          "justify-start w-full font-normal",
          "text-sm text-[12px] text-slate-500",
          item.current && "text-slate-800 dark:text-slate-200"
        )}
        onClick={onClick}
      >
        <div className="flex items-center">
          {item.icon && (
            <item.icon
              className={cn(
                "mr-2 h-3.5 w-3.5 text-slate-500",
                item.current && "text-slate-800 dark:text-slate-200"
              )}
            />
          )}
          {item.name}
          {item.isNew && (
            <div className="uppercase text-[9px] font-semibold border bg-gradient-to-r from-sky-400 via-heliblue to-sky-400 border-sky-500 px-1.5 rounded-full text-white ml-2 animate-shine bg-[length:200%_100%]">
              New
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

export default NavItem;
