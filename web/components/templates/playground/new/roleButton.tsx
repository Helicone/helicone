import { Menu, Transition } from "@headlessui/react";
import { clsx } from "../../../shared/clsx";
import { CheckIcon } from "@heroicons/react/24/outline";
import { Fragment } from "react";
import useNotification from "../../../shared/notification/useNotification";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

export const ROLE_COLORS = {
  system: "green",
  user: "blue",
  assistant: "purple",
  function: "yellow",
};

interface RoleButtonProps {
  // message: MessageInputItem;
  role: "system" | "user" | "assistant" | "function";
  onRoleChange: (role: "system" | "user" | "assistant" | "function") => void;
  // setMessage: (message: MessageInputItem) => void;
  // deleteMessage?: (messageInputId: string) => void;
  onDelete?: () => void;
  disabled?: boolean;
}

const RoleButton = (props: RoleButtonProps) => {
  const { role, onRoleChange, onDelete, disabled = false } = props;

  const { setNotification } = useNotification();

  return (
    <Menu as="div" className="relative inline-block text-left w-full">
      <div className="w-full flex justify-between">
        <Menu.Button
          disabled={disabled}
          className={clsx(
            `border border-${ROLE_COLORS[role]}-500 text-${ROLE_COLORS[role]}-900 dark:text-${ROLE_COLORS[role]}-300 font-semibold rounded-md text-sm bg-${ROLE_COLORS[role]}-100 dark:bg-${ROLE_COLORS[role]}-900  px-2 py-1 w-fit flex items-center`
          )}
        >
          {role}
          {!disabled && <ChevronDownIcon className="h-4 w-4 ml-1" />}
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="border border-gray-300 dark:border-gray-700 absolute mt-2 w-40 z-50 origin-top-right divide-y divide-gray-100 dark:divide-gray-900 rounded-md bg-white dark:bg-black shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-1 py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`${
                    active ? "bg-sky-100 dark:bg-sky-900" : ""
                  } text-gray-900 dark:text-gray-100 group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                  onClick={() => {
                    onRoleChange("user");
                  }}
                >
                  <div className="flex w-full items-center">User</div>
                  {role === "user" && <CheckIcon className="h-5 w-5" />}
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`${
                    active ? "bg-sky-100 dark:bg-sky-900" : ""
                  } text-gray-900 dark:text-gray-100 group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                  onClick={() => {
                    onRoleChange("assistant");
                  }}
                >
                  <div className="flex w-full items-center">Assistant</div>
                  {role === "assistant" && <CheckIcon className="h-5 w-5" />}
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`${
                    active ? "bg-sky-100 dark:bg-sky-900" : ""
                  } text-gray-900 dark:text-gray-100 group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                  onClick={() => {
                    onRoleChange("system");
                  }}
                >
                  <div className="flex w-full items-center">System</div>
                  {role === "system" && <CheckIcon className="h-5 w-5" />}
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default RoleButton;
