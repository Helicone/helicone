import { Button, buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/services/hooks/localStorage";
import {
  BookOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloudArrowUpIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/router";
import { useOrg } from "../organizationContext";
import OrgDropdown from "../orgDropdown";

interface SidebarProps {
  NAVIGATION: {
    name: string;
    href: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    current: boolean;
    featured?: boolean;
  }[];
  setReferOpen: (open: boolean) => void;
  setOpen: (open: boolean) => void;
}

const DesktopSidebar = ({
  NAVIGATION,
  setReferOpen,
  setOpen,
}: SidebarProps) => {
  const org = useOrg();
  const tier = org?.currentOrg?.tier;
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useLocalStorage(
    "isSideBarCollapsed",
    false
  );

  return (
    <div
      className={cn(
        "hidden md:flex md:flex-col z-30 bg-background dark:bg-gray-900 transition-all duration-300 h-screen bg-white pb-4",
        isCollapsed ? "md:w-16" : "md:w-56"
      )}
    >
      <div className="w-full flex flex-grow flex-col overflow-y-auto border-r dark:border-gray-700 justify-between">
        <div className="flex items-center gap-4 h-14 border-b dark:border-gray-700">
          {!isCollapsed && <OrgDropdown setReferOpen={setReferOpen} />}
          <div className={cn("mx-auto", !isCollapsed && "pr-4")}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-full flex justify-center dark:hover:bg-gray-800 px-2"
            >
              {isCollapsed ? (
                <ChevronRightIcon className="h-4 w-4" />
              ) : (
                <ChevronLeftIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex flex-grow flex-col">
          {(org?.currentOrg?.organization_type === "reseller" ||
            org?.isResellerOfCurrentCustomerOrg) && (
            <div className="flex w-full">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  router.push("/enterprise/portal");
                  if (
                    org.currentOrg?.organization_type === "customer" &&
                    org.currentOrg?.reseller_id
                  ) {
                    org.setCurrentOrg(org.currentOrg.reseller_id);
                  }
                }}
              >
                {org.currentOrg?.organization_type === "customer"
                  ? "Back to Portal"
                  : "Customer Portal"}
              </Button>
            </div>
          )}

          <div
            data-collapsed={isCollapsed}
            className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2 "
          >
            <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
              {NAVIGATION.map((link, index) =>
                isCollapsed ? (
                  <Tooltip key={index} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Link
                        href={link.href}
                        className={cn(
                          buttonVariants({
                            variant: "ghost",
                            size: "icon",
                          }),
                          "h-9 w-9",
                          link.current && "bg-accent hover:bg-accent" // Updated styling
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
                        <span className="ml-auto text-muted-foreground">
                          New
                        </span>
                      )}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Link
                    key={index}
                    href={link.href}
                    className={cn(
                      buttonVariants({
                        variant: link.current ? "secondary" : "ghost",
                        size: "sm",
                      }),
                      "justify-start"
                    )}
                  >
                    <link.icon
                      className={cn(
                        "mr-2 h-4 w-4",
                        link.current && "text-accent-foreground"
                      )}
                    />

                    {link.name}
                    {link.featured && (
                      <span
                        className={cn(
                          "ml-auto",
                          link.current
                            ? "text-accent-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        New
                      </span>
                    )}
                  </Link>
                )
              )}
            </nav>
          </div>
        </div>

        <div className="mt-auto">
          {isCollapsed ? (
            <>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-full dark:hover:bg-gray-800"
                    asChild
                  >
                    <Link
                      href="https://docs.helicone.ai/introduction"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <BookOpenIcon className="h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="dark:bg-gray-800 dark:text-gray-200"
                >
                  View Documentation
                </TooltipContent>
              </Tooltip>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-full dark:hover:bg-gray-800"
                    asChild
                  >
                    <Link
                      href="https://discord.gg/zsSTcH2qhG"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <QuestionMarkCircleIcon className="h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="dark:bg-gray-800 dark:text-gray-200"
                >
                  Help And Support
                </TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start dark:hover:bg-gray-800"
                asChild
              >
                <Link
                  href="https://docs.helicone.ai/introduction"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2"
                >
                  <BookOpenIcon className="h-4 w-4 mr-2" />
                  View Documentation
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start dark:hover:bg-gray-800"
                asChild
              >
                <Link
                  href="https://discord.gg/zsSTcH2qhG"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2"
                >
                  <QuestionMarkCircleIcon className="h-4 w-4 mr-2" />
                  Help And Support
                </Link>
              </Button>
            </>
          )}
        </div>

        {tier === "free" &&
          org?.currentOrg?.organization_type !== "customer" && (
            <div className={cn("p-4", isCollapsed && "hidden")}>
              <Button
                variant="outline"
                className="w-full justify-between dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                onClick={() => setOpen(true)}
              >
                <div className="flex items-center">
                  <CloudArrowUpIcon className="h-5 w-5 mr-1.5" />
                  <span>Free Plan</span>
                </div>
                <span className="text-xs font-normal text-primary dark:text-gray-300">
                  Learn More
                </span>
              </Button>
            </div>
          )}
      </div>
    </div>
  );
};

export default DesktopSidebar;
