import { Menu, Transition } from "@headlessui/react";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  BuildingOffice2Icon,
  CheckIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useOrg } from "./organizationContext";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { clsx } from "../clsx";
import { useRouter } from "next/router";
import { ORGANIZATION_ICONS } from "../../templates/organizations/createOrgForm";

interface OrgDropdownProps {}

export default function OrgDropdown(props: OrgDropdownProps) {
  const {} = props;
  const orgContext = useOrg();
  const user = useUser();
  const supabaseClient = useSupabaseClient();
  const router = useRouter();

  const ownedOrgs = orgContext?.allOrgs.filter((org) => org.owner === user?.id);
  const memberOrgs = orgContext?.allOrgs.filter(
    (org) => org.owner !== user?.id
  );

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="flex flex-row space-x-2 items-center hover:bg-gray-200 hover:cursor-pointer rounded-md w-fit py-1 -my-1 pr-3 -mr-3 pl-1 -ml-1">
        <BuildingOffice2Icon className="h-5 w-5 text-sky-500" />
        <div className="text-md font-semibold text-gray-900">
          {orgContext?.currentOrg.name}
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
        <Menu.Items className="absolute left-0 mt-2 w-52 z-50 origin-top-right divide-y divide-gray-200 rounded-md bg-white border border-gray-200 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none">
          {ownedOrgs && ownedOrgs.length > 0 && (
            <div className="py-1 px-1">
              <p className="text-gray-900 font-semibold text-sm px-2 py-2 w-full">
                Your Organizations
              </p>
              {ownedOrgs.map((org, idx) => {
                const icon = ORGANIZATION_ICONS.find(
                  (icon) => icon.name === org.icon
                );
                return (
                  <Menu.Item key={idx}>
                    {({ active }) => (
                      <button
                        className={`${
                          active ? "bg-sky-100 text-gray-700" : "text-gray-700"
                        } group flex w-full justify-between items-center rounded-md pl-4 pr-2 py-2 text-sm`}
                        onClick={() => {
                          orgContext?.setCurrentOrg(org.id);
                        }}
                      >
                        <div className="flex flex-row space-x-1.5 items-center">
                          {icon && (
                            <icon.icon className="h-4 w-4 text-gray-500" />
                          )}

                          <p className="w-32 text-left truncate">{org.name}</p>
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
          )}
          {memberOrgs && memberOrgs.length > 0 && (
            <div className="py-1 px-1">
              <p className="text-gray-900 font-semibold text-sm px-2 py-2 w-full">
                Member Organizations
              </p>
              {memberOrgs.map((org, idx) => (
                <Menu.Item key={idx}>
                  {({ active }) => (
                    <button
                      className={`${
                        active ? "bg-sky-100 text-gray-700" : "text-gray-700"
                      } group flex w-full justify-between items-center rounded-md pl-6 pr-2 py-2 text-sm`}
                      onClick={() => {
                        orgContext?.setCurrentOrg(org.id);
                      }}
                    >
                      <p>{org.name}</p>
                      {org.id === orgContext?.currentOrg.id && (
                        <CheckIcon className="h-4 w-4 text-sky-500" />
                      )}
                    </button>
                  )}
                </Menu.Item>
              ))}
            </div>
          )}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
