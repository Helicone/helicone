import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/router";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>> | null;
  current: boolean;
  featured?: boolean;
  subItems?: NavigationItem[];
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
  const router = useRouter();
  const hasSubItems = link.subItems && link.subItems.length > 0;

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Link
            href={hasSubItems ? link.subItems![0].href : link.href}
            onClick={(e) => {
              if (hasSubItems) {
                e.preventDefault();
                router.push(link.subItems![0].href);
              }
            }}
            className={cn(
              buttonVariants({
                variant: "ghost",
                size: "icon",
              }),
              "h-9 w-9",
              link.current && "bg-accent hover:bg-accent"
            )}
          >
            {link.icon && (
              <link.icon
                className={cn(
                  "h-4 w-4",
                  link.current && "text-accent-foreground"
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
            ? "flex items-center gap-1 font-medium text-slate-400 text-xs mt-[10px] text-[11px]"
            : cn(
                buttonVariants({
                  variant: link.current ? "secondary" : "ghost",
                  size: "xs",
                }),
                deep && deep > 1 ? "h-6" : "h-8",
                "justify-start w-full",
                "text-sm font-medium  text-[12px]"
              ),
          ""
        )}
      >
        <div className="flex items-center">
          {link.icon && (
            <link.icon
              className={cn(
                "mr-2 h-4 w-4",
                link.current && "text-accent-foreground"
              )}
            />
          )}
          {link.name}
        </div>
        {hasSubItems && (
          <ChevronRightIcon
            className={cn(
              "h-3 w-3 transition-transform fill-slate-400",
              expandedItems.includes(link.name) && "rotate-90"
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
