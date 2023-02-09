import { ReactNode } from "react";

interface AuthHeaderProps {
  title: string;
  actions?: ReactNode;
}

const AuthHeader = (props: AuthHeaderProps) => {
  const { title, actions } = props;

  return (
    <div className="sm:flex sm:items-center border-b border-gray-200 pb-4 mb-4">
      <div className="sm:flex-auto">
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      </div>
      <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">{actions}</div>
    </div>
  );
};

export default AuthHeader;
