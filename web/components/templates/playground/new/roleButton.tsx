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
  tool: "orange",
};

interface RoleButtonProps {
  // message: MessageInputItem;
  role: "system" | "user" | "assistant" | "function" | "tool";
  onRoleChange: (
    role: "system" | "user" | "assistant" | "function" | "tool",
  ) => void;
  // setMessage: (message: MessageInputItem) => void;
  // deleteMessage?: (messageInputId: string) => void;
  size?: "small" | "medium";
  onDelete?: () => void;
  disabled?: boolean;
}

const RoleButton = (props: RoleButtonProps) => {
  const {
    role,
    onRoleChange,
    onDelete,
    size = "medium",
    disabled = false,
  } = props;

  const { setNotification } = useNotification();

  return (
    <Menu as="div" className="relative inline-block w-full text-left">
      <div className="flex w-full justify-between">
        <Menu.Button
          disabled={disabled}
          className={clsx(
            size === "small" ? "text-xs" : "text-sm",
            `border border-${ROLE_COLORS[role]}-500 text-${ROLE_COLORS[role]}-900 dark:text-${ROLE_COLORS[role]}-300 rounded-md font-semibold bg-${ROLE_COLORS[role]}-100 dark:bg-${ROLE_COLORS[role]}-900 flex w-fit items-center px-2 py-1`,
          )}
        >
          {role ?? "Role"}
          {!disabled && <ChevronDownIcon className="ml-1 h-4 w-4" />}
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
        <Menu.Items className="absolute z-50 mt-2 w-40 origin-top-right divide-y divide-gray-100 rounded-md border border-gray-300 bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none dark:divide-gray-900 dark:border-gray-700 dark:bg-black">
          <div className="px-1 py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`${
                    active ? "bg-sky-100 dark:bg-sky-900" : ""
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900 dark:text-gray-100`}
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
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900 dark:text-gray-100`}
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
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900 dark:text-gray-100`}
                  onClick={() => {
                    onRoleChange("system");
                  }}
                >
                  <div className="flex w-full items-center">System</div>
                  {role === "system" && <CheckIcon className="h-5 w-5" />}
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`${
                    active ? "bg-sky-100 dark:bg-sky-900" : ""
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900 dark:text-gray-100`}
                  onClick={() => {
                    onRoleChange("function");
                  }}
                >
                  <div className="flex w-full items-center">Function</div>
                  {role === "function" && <CheckIcon className="h-5 w-5" />}
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`${
                    active ? "bg-sky-100 dark:bg-sky-900" : ""
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900 dark:text-gray-100`}
                  onClick={() => {
                    onRoleChange("tool");
                  }}
                >
                  <div className="flex w-full items-center">Tool</div>
                  {role === "tool" && <CheckIcon className="h-5 w-5" />}
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
