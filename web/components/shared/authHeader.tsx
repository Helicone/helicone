import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { ReactNode } from "react";
import { ISLAND_MARGIN } from "../ui/islandContainer";
import { cn } from "@/lib/utils";

interface AuthHeaderProps {
  title: React.ReactNode;
  breadcrumb?: {
    title: string;
    href: string;
  };
  headerActions?: ReactNode;
  actions?: ReactNode;
  isWithinIsland?: boolean;
}

const AuthHeader = (props: AuthHeaderProps) => {
  const { title, breadcrumb, headerActions, actions, isWithinIsland } = props;

  return (
    <div
      className={cn(
        "flex flex-row items-center justify-between py-4 w-full",
        !isWithinIsland && ISLAND_MARGIN
      )}
    >
      <div className="flex flex-col items-start space-y-2">
        {breadcrumb ? (
          <Link
            className="flex w-fit items-center text-gray-500 space-x-2 hover:text-gray-700"
            href={breadcrumb.href}
          >
            <ChevronLeftIcon className="h-4 w-4 inline" />
            <span className="text-sm font-semibold">{breadcrumb.title}</span>
          </Link>
        ) : (
          <div className="flex items-center space-x-4 ">
            <h1 className="flex w-fit items-center text-gray-500 space-x-2 hover:text-gray-700 font-bold">
              {title}
            </h1>
            {headerActions}
          </div>
        )}
      </div>
      <div className="items-center flex">{actions}</div>
    </div>
  );
};

export default AuthHeader;
