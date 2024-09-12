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
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
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
}

const NavItem: React.FC<NavItemProps> = ({
  link,
  isCollapsed,
  isSubItem = false,
  expandedItems,
  toggleExpand,
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
            <link.icon
              className={cn(
                "h-4 w-4",
                link.current && "text-accent-foreground"
              )}
            />
            <span className="sr-only">{link.name}</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          className="flex items-center gap-4 dark:bg-gray-800 dark:text-gray-200"
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
    <div className={cn(isSubItem && "ml-4")}>
      <Link
        href={hasSubItems ? "#" : link.href}
        onClick={hasSubItems ? () => toggleExpand(link.name) : undefined}
        className={cn(
          buttonVariants({
            variant: link.current ? "secondary" : "ghost",
            size: "sm",
          }),
          "justify-start w-full",
          hasSubItems && "flex items-center justify-between"
        )}
      >
        <div className="flex items-center">
          <link.icon
            className={cn(
              "mr-2 h-4 w-4",
              link.current && "text-accent-foreground"
            )}
          />
          {link.name}
        </div>
        {hasSubItems && (
          <ChevronRightIcon
            className={cn(
              "h-4 w-4 transition-transform",
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
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NavItem;
