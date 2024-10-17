import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { FileTextIcon } from "lucide-react";
import { FaDiscord } from "react-icons/fa6";
import { CalendarIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ChangelogItem } from "./auth/Sidebar";

const SidebarHelpDropdown = ({
  changelog,
  handleChangelogClick,
}: {
  changelog: ChangelogItem[];
  handleChangelogClick: (item: ChangelogItem) => void;
}) => {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-6 w-6 bg-white dark:bg-neutral-950 text-sm font-light focus-visible:ring-0 focus-visible:border-0 focus-visible:ring-transparent border border-slate-100 dark:border-slate-800"
        >
          ?
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="ml-4 w-64 text-slate-700 dark:text-slate-200">
        <Link href="https://discord.gg/zsSTcH2qhG" target="_blank">
          <DropdownMenuItem className="cursor-pointer">
            <FileTextIcon className="h-4 w-4 mr-2" />
            Docs
          </DropdownMenuItem>
        </Link>
        <Link href="https://discord.gg/zsSTcH2qhG" target="_blank">
          <DropdownMenuItem className="cursor-pointer">
            <FaDiscord className="h-4 w-4 mr-2" />
            Help and Support
          </DropdownMenuItem>
        </Link>
        <DropdownMenuLabel className="text-xs text-slate-500">
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
                className="cursor-pointer gap-2.5"
              >
                <div className="p-0.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-700 dark:bg-slate-200"></div>
                </div>
                <div className="w-full overflow-hidden text-ellipsis whitespace-nowrap">
                  {item.title}
                </div>
              </DropdownMenuItem>
            ))}
        <Link href="https://helicone.ai/changelog" target="_blank">
          <DropdownMenuItem className="cursor-pointer">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Changelog
          </DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SidebarHelpDropdown;
