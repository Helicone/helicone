import { Switch } from "@headlessui/react";
import { clsx } from "../clsx";
import { BoltIcon, BoltSlashIcon } from "@heroicons/react/24/outline";

export const ThemedSwitch = ({
  checked,
  onChange,
  label,
  OnIcon = BoltIcon,
  OffIcon = BoltSlashIcon,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  OnIcon?: React.ComponentType<any>;
  OffIcon?: React.ComponentType<any>;
}) => {
  return (
    <Switch.Group
      as="div"
      className="flex items-center space-x-3 hover:cursor-pointer"
    >
      <Switch.Label as="span" className="text-sm">
        <span className="font-semibold text-gray-700">{label}</span>
      </Switch.Label>
      <Switch
        checked={checked}
        onChange={onChange}
        className={clsx(
          checked ? "bg-emerald-500" : "bg-gray-200",
          "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        )}
      >
        <span className="sr-only">Use setting</span>
        <span
          className={clsx(
            checked ? "translate-x-5" : "translate-x-0",
            "pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
          )}
        >
          <span
            className={clsx(
              checked
                ? "opacity-0 duration-100 ease-out"
                : "opacity-100 duration-200 ease-in",
              "absolute inset-0 flex h-full w-full items-center justify-center transition-opacity"
            )}
            aria-hidden="true"
          >
            <OnIcon className="h-3 w-3 text-gray-400" />
          </span>
          <span
            className={clsx(
              checked
                ? "opacity-100 duration-200 ease-in"
                : "opacity-0 duration-100 ease-out",
              "absolute inset-0 flex h-full w-full items-center justify-center transition-opacity"
            )}
            aria-hidden="true"
          >
            <OffIcon className="h-3 w-3 text-emerald-500" />
          </span>
        </span>
      </Switch>
    </Switch.Group>
  );
};
