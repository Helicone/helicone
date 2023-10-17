import { ArrowUturnLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { ReactNode } from "react";
import { clsx } from "./clsx";

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumb?: {
    title: string;
    href: string;
  };
  headerActions?: ReactNode;
  actions?: ReactNode;

  // delete this once jobs is out of beta
  jobs?: boolean;
}

const AuthHeader = (props: AuthHeaderProps) => {
  const { title, breadcrumb, headerActions, actions, jobs = false } = props;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-200 pb-2 mb-4 justify-between">
      <div className="sm:flex-auto items-center flex flex-row space-x-4">
        <div className="flex flex-row space-x-4 items-center">
          {breadcrumb && (
            <>
              <Link
                className="text-xl font-semibold text-gray-900 flex flex-row items-center hover:underline space-x-2"
                href={breadcrumb.href}
              >
                <ArrowUturnLeftIcon className="h-4 w-4 text-gray-900" />
                <p>{breadcrumb.title}</p>
              </Link>
              <span className="text-gray-900">/</span>
            </>
          )}
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          {jobs && (
            <span
              className={clsx(
                "bg-violet-50 text-violet-700 ring-violet-200",
                `inline-flex items-center rounded-full px-2 py-1 -my-1 text-xs font-medium ring-1 ring-inset`
              )}
            >
              beta
            </span>
          )}
          {props.subtitle && (
            <h2 className="text-md font-normal text-gray-500">
              {props.subtitle}
            </h2>
          )}
        </div>

        {headerActions}
      </div>
      <div className="items-center mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
        {actions}
      </div>
    </div>
  );
};

export default AuthHeader;
