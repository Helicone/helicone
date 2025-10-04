import { truncString } from "../../../lib/stringHelpers";
import React from "react";

interface ThemedListItemProps {
  onClickHandler: () => void;
  title: string;
  subtitle: string;
  value: number | string; // the value to display on the right hand side
  icon?: React.ForwardRefExoticComponent<
    React.SVGProps<SVGSVGElement> & {
      title?: string | undefined;
      titleId?: string | undefined;
    }
  >;
  pill?: React.ReactNode; // the pill accent next to the title
  secondarySubtitle?: string;
}

const ThemedListItem = (props: ThemedListItemProps) => {
  const { onClickHandler, title, subtitle, value, pill, secondarySubtitle } =
    props;

  return (
    <button
      className="flex w-full flex-row items-center justify-between px-2 py-3 hover:bg-gray-100 dark:hover:bg-gray-900"
      onClick={onClickHandler}
    >
      <div className="flex flex-col space-y-0.5">
        <div className="flex flex-row items-center gap-2.5">
          <p className="hidden text-left text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100 xl:block">
            {truncString(title, 56)}
          </p>
          <p className="hidden text-left text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100 md:block xl:hidden">
            {truncString(title, 36)}
          </p>
          <p className="block text-left text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100 md:hidden">
            {truncString(title, 16)}
          </p>
          {pill && pill}
        </div>

        <div className="hidden flex-row items-center space-x-2 md:flex">
          <p className="text-xs leading-5 text-gray-500">{subtitle}</p>
          {secondarySubtitle && (
            <>
              <svg
                viewBox="0 0 2 2"
                className="h-0.5 w-0.5 fill-current text-gray-500"
              >
                <circle cx={1} cy={1} r={1} />
              </svg>
              <p className="text-xs leading-5 text-gray-500">
                {secondarySubtitle}
              </p>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-row items-center space-x-1">
        {props.icon && <props.icon className="h-5 w-5 text-gray-500" />}

        <p className="text-md font-semibold text-gray-700 dark:text-gray-300">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
      </div>
    </button>
  );
};

export default ThemedListItem;
