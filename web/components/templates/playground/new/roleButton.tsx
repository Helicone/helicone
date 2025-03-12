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

  // Helper function to convert to sentence case
  const toSentenceCase = (text: string) => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  return (
    <Menu as="div" className="relative inline-block text-left w-full">
      <div className="w-full flex justify-between">
        <Menu.Button
          disabled={disabled}
          className="text-xs font-semibold text-sidebar-foreground bg-transparent"
        >
          {role ? toSentenceCase(role) : "Role"}
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
        <Menu.Items className="border border-border absolute mt-2 w-40 z-50 origin-top-right divide-y divide-border rounded-md bg-white dark:bg-black shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-1 py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`${active ? "bg-sky-100 dark:bg-sky-900" : ""
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
                  className={`${active ? "bg-sky-100 dark:bg-sky-900" : ""
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
                  className={`${active ? "bg-sky-100 dark:bg-sky-900" : ""
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
