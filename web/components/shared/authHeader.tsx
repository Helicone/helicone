import Link from "next/link";
import { ReactNode } from "react";

interface AuthHeaderProps {
  title: string;
  breadcrumb?: {
    title: string;
    href: string;
  };
  headerActions?: ReactNode;
  actions?: ReactNode;
}

const AuthHeader = (props: AuthHeaderProps) => {
  const { title, breadcrumb, headerActions, actions } = props;

  return (
    <div className="flex flex-row sm:items-center border-b border-gray-200 pb-2 mb-4 justify-between">
      <div className="sm:flex-auto items-center flex flex-row space-x-4">
        <div className="flex flex-row space-x-4 items-center">
          {breadcrumb && (
            <div className="flex flex-row space-x-4 items-center">
              <Link
                className="text-xl font-semibold text-gray-900  hover:underline"
                href={breadcrumb.href}
              >
                {breadcrumb.title}
              </Link>
              <p>/</p>
            </div>
          )}
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        </div>

        {headerActions}
      </div>
      <div className="items-center sm:mt-0 sm:ml-16 sm:flex-none">
        {actions}
      </div>
    </div>
  );
};

export default AuthHeader;
