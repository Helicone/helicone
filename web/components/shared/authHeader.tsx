import { ReactNode } from "react";

interface AuthHeaderProps {
  title: string;
  headerActions?: ReactNode;
  actions?: ReactNode;
}

const AuthHeader = (props: AuthHeaderProps) => {
  const { title, headerActions, actions } = props;

  return (
    <div className="flex flex-row sm:items-center border-b border-gray-200 pb-2 mb-2 justify-between">
      <div className="sm:flex-auto items-center flex flex-row space-x-4">
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {headerActions}
      </div>
      <div className="items-center sm:mt-0 sm:ml-16 sm:flex-none">
        {actions}
      </div>
    </div>
  );
};

export default AuthHeader;
