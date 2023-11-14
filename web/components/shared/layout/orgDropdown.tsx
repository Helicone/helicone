import { Menu, Transition } from "@headlessui/react";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  BuildingOffice2Icon,
  CheckIcon,
  ChevronDownIcon,
  MoonIcon,
  PlusIcon,
  SunIcon,
  UserCircleIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import { useOrg } from "./organizationContext";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { clsx } from "../clsx";
import { useRouter } from "next/router";
import CreateOrgForm, {
  ORGANIZATION_COLORS,
  ORGANIZATION_ICONS,
} from "../../templates/organization/createOrgForm";
import Link from "next/link";
import ThemedModal from "../themed/themedModal";
import { useUserSettings } from "../../../services/hooks/userSettings";
import useNotification from "../notification/useNotification";
import { useGetOrgMembers } from "../../../services/hooks/organizations";
import AddMemberModal from "../../templates/organization/addMemberModal";
import { ThemedSwitch } from "../themed/themedSwitch";
import { useTheme } from "../theme/themeContext";

interface OrgDropdownProps {}

export default function OrgDropdown(props: OrgDropdownProps) {
  const orgContext = useOrg();
  const user = useUser();
  const supabaseClient = useSupabaseClient();
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);

  const org = useOrg();
  const themeContext = useTheme();

  const [addOpen, setAddOpen] = useState(false);

  const ownedOrgs = orgContext?.allOrgs.filter((org) => org.owner === user?.id);
  const memberOrgs = orgContext?.allOrgs.filter(
    (org) => org.owner !== user?.id
  );

  const currentIcon = ORGANIZATION_ICONS.find(
    (icon) => icon.name === orgContext?.currentOrg.icon
  );

  const currentColor = ORGANIZATION_COLORS.find(
    (icon) => icon.name === orgContext?.currentOrg.color
  );

  const createNewOrgHandler = () => {
    setCreateOpen(true);
  };

  return (
    <>
      <Menu as="div" className="relative inline-block text-left">
        <Menu.Button
          className={clsx(
            "text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100",
            "group flex justify-between w-56 items-center pl-2 pr-3 py-2 text-sm font-medium rounded-md"
          )}
        >
          <div className="flex space-x-1">
            {currentIcon && (
              <currentIcon.icon
                className={clsx(
                  `text-${currentColor?.name}-500`,
                  "mr-3 flex-shrink-0 h-5 w-5"
                )}
                aria-hidden="true"
              />
            )}
            <p className="text-md font-semibold text-gray-900 dark:text-gray-100 truncate w-fit max-w-[9rem] text-left">
              {orgContext?.currentOrg.name}
            </p>
          </div>
          <div className="px-[7px] py-0.5 text-sm bg-gray-900 dark:bg-gray-500 dark:text-gray-900 text-gray-50 rounded-full flex items-center justify-center focus:ring-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2">
            <span className="sr-only">Open user menu</span>
            {user?.email?.charAt(0).toUpperCase() || (
              <UserCircleIcon className="h-8 w-8 text-black dark:text-white" />
            )}
          </div>
        </Menu.Button>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute left-0 mt-2 w-[16rem] z-50 origin-top-right divide-y divide-gray-200 dark:divide-gray-800 rounded-md bg-white dark:bg-black border border-gray-300 dark:border-gray-700 shadow-2xl">
            <div className="flex flex-row justify-between items-center divide-x divide-gray-300 dark:divide-gray-700">
              <p className="text-gray-900 dark:text-gray-100 text-sm w-full truncate pl-4 p-2">
                {user?.email} fsdklfjskFJDSlfjdslFJKLDSkfds
              </p>
              <div className="p-2">
                <ThemedSwitch
                  checked={themeContext?.theme === "dark" ? true : false}
                  onChange={() => {
                    themeContext?.theme === "dark"
                      ? themeContext?.setTheme("light")
                      : themeContext?.setTheme("dark");
                  }}
                  OnIcon={SunIcon}
                  OffIcon={MoonIcon}
                />
              </div>
            </div>

            {ownedOrgs && ownedOrgs.length > 0 && (
              <div className="p-1">
                <p className="text-gray-900 dark:text-gray-100 font-semibold text-xs px-2 py-2 w-full">
                  Your Organizations{" "}
                  {ownedOrgs.length > 7 && (
                    <span className="text-xs text-gray-400 dark:text-gray-600 font-normal pl-2">
                      ({ownedOrgs.length})
                    </span>
                  )}
                </p>
                <div className="h-full max-h-60 overflow-auto">
                  {ownedOrgs.map((org, idx) => {
                    const icon = ORGANIZATION_ICONS.find(
                      (icon) => icon.name === org.icon
                    );
                    return (
                      <Menu.Item key={idx}>
                        {({ active }) => (
                          <button
                            className={`${
                              active
                                ? "bg-sky-100 text-gray-700 dark:bg-sky-900 dark:text-gray-300"
                                : "text-gray-700 dark:text-gray-300"
                            } group flex w-full justify-between items-center rounded-md pl-4 pr-2 py-2 text-sm`}
                            onClick={() => {
                              orgContext?.setCurrentOrg(org.id);
                            }}
                          >
                            <div className="flex flex-row space-x-2 items-center">
                              {icon && (
                                <icon.icon className="h-4 w-4 text-gray-500" />
                              )}
                              <div className="flex flex-row space-x-1">
                                <p className="w-full max-w-[10rem] text-left truncate">
                                  {org.name}
                                </p>
                                <span className="text-sky-500">
                                  {org.tier === "pro" && "(Pro)"}
                                </span>
                              </div>
                            </div>
                            {org.id === orgContext?.currentOrg.id && (
                              <CheckIcon className="h-4 w-4 text-sky-500" />
                            )}
                          </button>
                        )}
                      </Menu.Item>
                    );
                  })}
                </div>
              </div>
            )}
            {memberOrgs && memberOrgs.length > 0 && (
              <div className="p-1">
                <p className="text-gray-900 dark:text-gray-100 font-semibold text-xs px-2 py-2 w-full">
                  Member Organizations
                  {memberOrgs.length > 7 && (
                    <span className="text-xs text-gray-400 dark:text-gray-600 font-normal pl-2">
                      ({memberOrgs.length})
                    </span>
                  )}
                </p>
                <div className="h-full max-h-60 overflow-auto">
                  {memberOrgs.map((org, idx) => {
                    const icon = ORGANIZATION_ICONS.find(
                      (icon) => icon.name === org.icon
                    );
                    return (
                      <Menu.Item key={idx}>
                        {({ active }) => (
                          <button
                            className={`${
                              active
                                ? "bg-sky-100 text-gray-700 dark:bg-sky-900 dark:text-gray-300"
                                : "text-gray-700 dark:text-gray-300"
                            } group flex w-full justify-between items-center rounded-md pl-4 pr-2 py-2 text-sm`}
                            onClick={() => {
                              orgContext?.setCurrentOrg(org.id);
                            }}
                          >
                            <div className="flex flex-row space-x-2 items-center">
                              {icon && (
                                <icon.icon className="h-4 w-4 text-gray-500" />
                              )}
                              <div className="flex flex-row space-x-1">
                                <p className="w-full max-w-[10rem] text-left truncate">
                                  {org.name}
                                </p>
                                <span className="text-sky-500">
                                  {org.tier === "pro" && "(Pro)"}
                                </span>
                              </div>
                            </div>
                            {org.id === orgContext?.currentOrg.id && (
                              <CheckIcon className="h-4 w-4 text-sky-500" />
                            )}
                          </button>
                        )}
                      </Menu.Item>
                    );
                  })}
                </div>
              </div>
            )}
            <Menu.Item>
              <div className="p-1">
                <button
                  onClick={() => setAddOpen(true)}
                  className={clsx(
                    "flex items-center space-x-2 text-gray-700 hover:bg-sky-100 dark:text-gray-300 dark:hover:bg-sky-900 rounded-md text-sm pl-4 py-2 w-full truncate"
                  )}
                >
                  <UserPlusIcon className="h-4 w-4 text-gray-500 mr-2" />
                  Invite Members
                </button>
                <button
                  onClick={() => {
                    createNewOrgHandler();
                  }}
                  className={clsx(
                    "flex items-center text-gray-700 hover:bg-sky-100 dark:text-gray-300 dark:hover:bg-sky-900 rounded-md text-sm pl-4 py-2 w-full truncate"
                  )}
                >
                  <PlusIcon className="h-4 w-4 text-gray-500 mr-2" />
                  <p>Create New Org</p>
                </button>
              </div>
            </Menu.Item>

            <div className="p-1">
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={clsx(
                      "text-left block text-gray-700 hover:bg-red-100 dark:text-gray-300 dark:hover:bg-red-900 rounded-md text-sm pl-3 py-2 w-full truncate"
                    )}
                    onClick={async () => {
                      supabaseClient.auth.signOut().then(() => {
                        router.push("/");
                      });
                    }}
                  >
                    Sign out
                  </button>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
      <ThemedModal open={createOpen} setOpen={setCreateOpen}>
        <div className="w-[400px] z-50">
          <CreateOrgForm onCancelHandler={setCreateOpen} />
        </div>
      </ThemedModal>
      <AddMemberModal
        orgId={org?.currentOrg.id || ""}
        orgOwnerId={org?.currentOrg.owner || ""}
        open={addOpen}
        setOpen={setAddOpen}
      />
    </>
  );
}
