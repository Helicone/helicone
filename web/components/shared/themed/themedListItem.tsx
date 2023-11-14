import { truncString } from "../../../lib/stringHelpers";

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
      className="py-3 flex flex-row justify-between items-center w-full hover:bg-gray-100 dark:hover:bg-gray-900 px-2"
      onClick={onClickHandler}
    >
      <div className="flex flex-col space-y-0.5">
        <div className="flex flex-row gap-2.5 items-center">
          <p className="hidden xl:block text-sm text-gray-900 dark:text-gray-100 leading-6 font-semibold text-left">
            {truncString(title, 56)}
          </p>
          <p className="hidden md:block xl:hidden text-sm text-gray-900 dark:text-gray-100 leading-6 font-semibold text-left">
            {truncString(title, 36)}
          </p>
          <p className="block md:hidden text-sm text-gray-900 dark:text-gray-100 leading-6 font-semibold text-left">
            {truncString(title, 16)}
          </p>
          {pill && pill}
        </div>

        <div className="hidden md:flex flex-row space-x-2 items-center">
          <p className="text-xs text-gray-500 leading-5">{subtitle}</p>
          {secondarySubtitle && (
            <>
              <svg
                viewBox="0 0 2 2"
                className="h-0.5 w-0.5 fill-current text-gray-500"
              >
                <circle cx={1} cy={1} r={1} />
              </svg>
              <p className="text-xs text-gray-500 leading-5">
                {secondarySubtitle}
              </p>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-row space-x-1 items-center">
        {props.icon && <props.icon className="h-5 w-5 text-gray-500" />}

        <p className="text-md font-semibold text-gray-700 dark:text-gray-300">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
      </div>
    </button>
  );
};

export default ThemedListItem;
