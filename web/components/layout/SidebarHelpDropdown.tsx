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
import { useState } from "react";
import { FaDiscord } from "react-icons/fa6";
import { ChangelogItem } from "./auth/types";

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
  return (
    <div className="w-full flex flex-col items-center gap-2">
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
              "h-9  flex items-center text-xs text-muted-foreground hover:text-foreground",
              isCollapsed ? "w-9" : "w-full gap-1"
            )}
          >
            <div className="relative flex items-center">
              <span
                className={clsx(
                  "font-medium text-xs",
                  hasNewChangelog && "text-primary"
                )}
              >
                ?
              </span>
              {hasNewChangelog && (
                <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-destructive"></span>
              )}
            </div>
            {!isCollapsed && <span>Help</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="ml-4 w-64 text-slate-700 dark:text-slate-200">
          <Link href="https://docs.helicone.ai" target="_blank">
            <DropdownMenuItem className="cursor-pointer">
              <FileTextIcon className="h-4 w-4 mr-2 text-slate-500" />
              Docs
              <ArrowUpRightIcon className="h-3.5 w-3.5 ml-2 text-slate-400 dark:text-slate-600" />
            </DropdownMenuItem>
          </Link>
          <Link href="https://discord.gg/zsSTcH2qhG" target="_blank">
            <DropdownMenuItem className="cursor-pointer">
              <FaDiscord className="h-4 w-4 mr-2 text-slate-500" />
              Help and Support
              <ArrowUpRightIcon className="h-3.5 w-3.5 ml-2 text-slate-400 dark:text-slate-600" />
            </DropdownMenuItem>
          </Link>
          <DropdownMenuLabel className="text-xs text-slate-400 dark:text-slate-600 font-medium mt-2">
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
                    className="lucide lucide-calendar-1 w-4 h-4 mr-2 text-slate-500"
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
              <CalendarIcon className="h-4 w-4 mr-2 text-slate-500" />
              Full changelog
              <ArrowUpRightIcon className="h-3.5 w-3.5 ml-2 text-slate-400 dark:text-slate-600" />
            </DropdownMenuItem>
          </Link>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        size="none"
        onClick={() => {
          if (window.Pylon) {
            if (chatOpen) {
              window.Pylon("hide");
            } else {
              window.Pylon("show");
            }
            setChatOpen(!chatOpen);
          }
        }}
        className={clsx(
          "flex items-center text-xs text-muted-foreground hover:text-foreground",
          isCollapsed ? "h-9 w-9" : "h-7 w-full gap-1",
          chatOpen && "text-primary"
        )}
      >
        <MessageCircleMore
          size={12}
          className={clsx(
            chatOpen
              ? "text-primary"
              : "text-muted-foreground hover:text-primary"
          )}
        />
        {!isCollapsed && <span>Message us</span>}
      </Button>
    </div>
  );
};

export default SidebarHelpDropdown;
