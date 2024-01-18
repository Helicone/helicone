import { Menu, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { CheckIcon } from "@heroicons/react/24/outline";
import { useOrg } from "./organizationContext";
import { useUser } from "@supabase/auth-helpers-react";
import { clsx } from "../shared/clsx";
import CreateOrgForm, {
  ORGANIZATION_COLORS,
  ORGANIZATION_ICONS,
} from "../templates/organization/createOrgForm";
import ThemedModal from "../shared/themed/themedModal";
import AddMemberModal from "../templates/organization/addMemberModal";

interface OrgDropdownProps {}

export default function OrgDropdown(props: OrgDropdownProps) {
  const orgContext = useOrg();
  const user = useUser();
  const [createOpen, setCreateOpen] = useState(false);

  const org = useOrg();

  const [addOpen, setAddOpen] = useState(false);

  const ownedOrgs = orgContext?.allOrgs.filter(
    (org) => org.owner === user?.id && org.organization_type !== "customer"
  );
  const memberOrgs = orgContext?.allOrgs.filter(
    (org) => org.owner !== user?.id && org.organization_type !== "customer"
  );
  const customerOrgs = orgContext?.allOrgs.filter(
    (org) => org.organization_type === "customer"
  );

  const currentIcon = ORGANIZATION_ICONS.find(
    (icon) => icon.name === orgContext?.currentOrg?.icon
  );

  const currentColor = ORGANIZATION_COLORS.find(
    (icon) => icon.name === orgContext?.currentOrg?.color
  );

  const createNewOrgHandler = () => {
    setCreateOpen(true);
  };

  return (
    <>
      <Menu as="div" className="relative inline-block text-left w-full">
        <Menu.Button
          className={clsx(
            "text-gray-500 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100",
            "group flex justify-between w-full items-center p-2 text-sm font-medium rounded-md"
          )}
        >
          <div className="flex items-center">
            {currentIcon && (
              <currentIcon.icon
                className={clsx(
                  `text-${currentColor?.name}-500`,
                  "mr-3 flex-shrink-0 h-4 w-4"
                )}
                aria-hidden="true"
              />
            )}
            <p className="text-md font-semibold text-gray-900 dark:text-gray-100 truncate w-fit max-w-[7.25rem] text-left">
              {orgContext?.currentOrg?.name}
            </p>
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
          <Menu.Items className="absolute left-0 mt-1 w-[15rem] z-50 origin-top-right divide-y divide-gray-200 dark:divide-gray-800 rounded-md bg-white dark:bg-black border border-gray-300 dark:border-gray-700 shadow-2xl">
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
                            {org.id === orgContext?.currentOrg?.id && (
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
                <div className="h-full max-h-60 w-full overflow-x-auto">
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
                              <div className="flex flex-row space-x-1 w-full">
                                <p
                                  className={clsx(
                                    org.tier === "pro"
                                      ? "max-w-[7.5rem]"
                                      : "max-w-[10rem]",
                                    "w-full text-left truncate"
                                  )}
                                >
                                  {org.name}
                                </p>
                                <span className="text-sky-500">
                                  {org.tier === "pro" && "(Pro)"}
                                </span>
                              </div>
                            </div>
                            {org.id === orgContext?.currentOrg?.id && (
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
            {customerOrgs && customerOrgs.length > 0 && (
              <div className="p-1">
                <p className="text-gray-900 dark:text-gray-100 font-semibold text-xs px-2 py-2 w-full">
                  Customers{" "}
                  {customerOrgs.length > 7 && (
                    <span className="text-xs text-gray-400 dark:text-gray-600 font-normal pl-2">
                      ({customerOrgs.length})
                    </span>
                  )}
                </p>
                <div className="h-full max-h-60 overflow-auto">
                  {customerOrgs.map((org, idx) => {
                    const icon = ORGANIZATION_ICONS.find(
                      (icon) => icon.name === org.icon
                    );
                    return (
                      <Menu.Item key={idx}>
                        {({ active }) => (
                          <button
                            className={`${
                              active
                                ? "bg-amber-100 text-gray-700 dark:bg-amber-900 dark:text-gray-300"
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
                            {org.id === orgContext?.currentOrg?.id && (
                              <CheckIcon className="h-4 w-4 text-amber-500" />
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
                  onClick={() => {
                    createNewOrgHandler();
                  }}
                  className={clsx(
                    "flex items-center text-gray-700 hover:bg-sky-100 dark:text-gray-300 dark:hover:bg-sky-900 rounded-md text-sm pl-4 py-2 w-full truncate"
                  )}
                >
                  <p>Create New Org</p>
                </button>
                <button
                  onClick={() => setAddOpen(true)}
                  className={clsx(
                    "flex items-center space-x-2 text-gray-700 hover:bg-sky-100 dark:text-gray-300 dark:hover:bg-sky-900 rounded-md text-sm pl-4 py-2 w-full truncate"
                  )}
                >
                  Invite Members
                </button>
              </div>
            </Menu.Item>
          </Menu.Items>
        </Transition>
      </Menu>
      <ThemedModal open={createOpen} setOpen={setCreateOpen}>
        <div className="w-[400px] z-50">
          <CreateOrgForm onCancelHandler={setCreateOpen} />
        </div>
      </ThemedModal>

      <AddMemberModal
        orgId={org?.currentOrg?.id || ""}
        orgOwnerId={org?.currentOrg?.owner || ""}
        open={addOpen}
        setOpen={setAddOpen}
      />
    </>
  );
}
