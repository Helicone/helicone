import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocalStorage } from "@/services/hooks/localStorage";
import clsx from "clsx";
import {
  ArrowUpRightIcon,
  CalendarIcon,
  FileTextIcon,
  MessageCircleMore,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaDiscord } from "react-icons/fa6";
import { ChangelogItem } from "./auth/types";
import { useOrg } from "./org/organizationContext";
import Intercom from "@intercom/messenger-js-sdk";
import { useHeliconeAuthClient } from "@/packages/common/auth/client/AuthClientFactory";
import { usePathname } from "next/navigation";

export const INTERCOM_APP_ID = "mna0ba2h";
const SidebarHelpDropdown = ({
  changelog,
  handleChangelogClick,
  isCollapsed,
}: {
  changelog: ChangelogItem[];
  handleChangelogClick: (item: ChangelogItem) => void;
  isCollapsed: boolean;
}) => {
  const [latestChangelogSeen, setLatestChangelogSeen] = useLocalStorage<
    string | null
  >("latestChangelogSeen", null);

  const hasNewChangelog =
    changelog.length > 0 && latestChangelogSeen !== changelog[0].title;

  const [chatOpen, setChatOpen] = useState(false);
  const orgContext = useOrg();
  const heliconeAuthClient = useHeliconeAuthClient();
  Intercom({
    app_id: INTERCOM_APP_ID,
    user_id: heliconeAuthClient.user?.id,
    name: orgContext?.currentOrg?.name,
    email: heliconeAuthClient.user?.email,
  });
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.includes("dashboard")) {
      // Only want to show on dashboard for now
      Intercom({ app_id: INTERCOM_APP_ID, hide_default_launcher: true });
    } else {
      Intercom({ app_id: INTERCOM_APP_ID, hide_default_launcher: true });
    }
  }, [pathname]);
  return (
    <div className="flex w-full flex-col items-center">
      <DropdownMenu
        modal={false}
        onOpenChange={
          changelog.length > 0
            ? () => setLatestChangelogSeen(changelog[0].title)
            : undefined
        }
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="none"
            className={clsx(
              "flex h-9 items-center text-xs text-muted-foreground hover:text-foreground",
              isCollapsed ? "w-9" : "w-full gap-1",
            )}
          >
            <div className="relative flex items-center">
              <span
                className={clsx(
                  "text-xs font-medium",
                  hasNewChangelog && "text-primary",
                )}
              >
                ?
              </span>
            </div>
            {!isCollapsed && <span>Help</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="ml-4 w-64 text-slate-700 dark:text-slate-200">
          <Link href="https://docs.helicone.ai" target="_blank">
            <DropdownMenuItem className="cursor-pointer">
              <FileTextIcon className="mr-2 h-4 w-4 text-slate-500" />
              Docs
              <ArrowUpRightIcon className="ml-2 h-3.5 w-3.5 text-slate-400 dark:text-slate-600" />
            </DropdownMenuItem>
          </Link>
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={() => {
              setChatOpen(!chatOpen);
              Intercom({
                app_id: INTERCOM_APP_ID,
                hide_default_launcher: !chatOpen,
              });
            }}
          >
            <MessageCircleMore className="mr-2 h-4 w-4 text-slate-500" />
            Message us
          </DropdownMenuItem>
          <Link href="https://discord.gg/zsSTcH2qhG" target="_blank">
            <DropdownMenuItem className="cursor-pointer">
              <FaDiscord className="mr-2 h-4 w-4 text-slate-500" />
              Help and Support
              <ArrowUpRightIcon className="ml-2 h-3.5 w-3.5 text-slate-400 dark:text-slate-600" />
            </DropdownMenuItem>
          </Link>
          <DropdownMenuLabel className="mt-2 text-xs font-medium text-slate-400 dark:text-slate-600">
            What&apos;s new?
          </DropdownMenuLabel>
          {changelog.length === 0
            ? new Array(2).fill(null).map((_, index) => (
                <DropdownMenuItem key={index}>
                  <Skeleton className="h-4 w-full" />
                </DropdownMenuItem>
              ))
            : changelog.map((item) => (
                <DropdownMenuItem
                  onSelect={() => handleChangelogClick(item)}
                  key={item.title}
                  className="cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-calendar-1 mr-2 h-4 w-4 text-slate-500"
                  >
                    <text
                      x="50%"
                      y="17"
                      fontSize="10"
                      strokeWidth="1"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {new Date(item.pubDate).getDate()}
                    </text>
                    <path d="M16 2v4" />
                    <path d="M3 10h18" />
                    <path d="M8 2v4" />
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                  </svg>
                  <div className="w-full overflow-hidden text-ellipsis whitespace-nowrap">
                    {item.title}
                  </div>
                </DropdownMenuItem>
              ))}
          <Link href="https://helicone.ai/changelog" target="_blank">
            <DropdownMenuItem className="cursor-pointer">
              <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
              Full changelog
              <ArrowUpRightIcon className="ml-2 h-3.5 w-3.5 text-slate-400 dark:text-slate-600" />
            </DropdownMenuItem>
          </Link>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default SidebarHelpDropdown;
