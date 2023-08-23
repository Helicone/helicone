import { Menu, Transition } from "@headlessui/react";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  BuildingOffice2Icon,
  CheckIcon,
  ChevronDownIcon,
  PlusIcon,
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
} from "../../templates/organizations/createOrgForm";
import Link from "next/link";
import InviteMemberButton from "../inviteMembers";
import ThemedModal from "../themed/themedModal";
import { useUserSettings } from "../../../services/hooks/userSettings";
import useNotification from "../notification/useNotification";
import { useGetOrgMembers } from "../../../services/hooks/organizations";

interface OrgDropdownProps {
  userSettings: {
    created_at: string | null;
    request_limit: number;
    tier: string;
    user: string;
  } | null;
}

export default function OrgDropdown(props: OrgDropdownProps) {
  const { userSettings } = props;
  const orgContext = useOrg();
  const user = useUser();
  const supabaseClient = useSupabaseClient();
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);

  const org = useOrg();
  const { setNotification } = useNotification();
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

  const onSubmitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const email = e.currentTarget.elements.namedItem(
      "email"
    ) as HTMLInputElement;

    if (!email || !email.value || !org?.currentOrg) {
      setNotification("Failed to add member. Please try again.", "error");
      return;
    }

    fetch(
      `/api/organization/${org?.currentOrg.id}/add_member?email=${email.value}`
    )
      .then((res) => res.json())
      .then((res) => {
        if (res.error) {
          if (res.error.length < 30) {
            setNotification(res.error, "error");
            console.error(res);
          } else {
            setNotification("Error adding member", "error");
            console.error(res);
          }
        } else {
          setNotification("Member successfully invited.", "success");
          setAddOpen(false);
        }
      });
  };

  return (
    <>
      <Menu as="div" className="relative inline-block text-left">
        <Menu.Button
          className={clsx(
            "text-gray-600 hover:bg-gray-200 hover:text-gray-900",
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
            <p className="text-md font-semibold text-gray-900 truncate w-fit max-w-[9rem] text-left">
              {orgContext?.currentOrg.name}
            </p>
          </div>
          <div className="px-[7px] py-0.5 text-sm bg-gray-900 text-gray-50 rounded-full flex items-center justify-center focus:ring-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2">
            <span className="sr-only">Open user menu</span>
            {user?.email?.charAt(0).toUpperCase() || (
              <UserCircleIcon className="h-8 w-8 text-black" />
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
          <Menu.Items className="absolute left-0 mt-2 w-56 z-40 origin-top-right divide-y divide-gray-200 rounded-md bg-white border border-gray-200 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none">
            <p className="text-gray-900 text-sm p-3 w-full truncate">
              {user?.email}
            </p>
            {ownedOrgs && ownedOrgs.length > 0 && (
              <div className="p-1">
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
                            active
                              ? "bg-sky-100 text-gray-700"
                              : "text-gray-700"
                          } group flex w-full justify-between items-center rounded-md pl-4 pr-2 py-2 text-sm`}
                          onClick={() => {
                            orgContext?.setCurrentOrg(org.id);
                          }}
                        >
                          <div className="flex flex-row space-x-2 items-center">
                            {icon && (
                              <icon.icon className="h-4 w-4 text-gray-500" />
                            )}

                            <p className="w-32 text-left truncate">
                              {org.name}
                            </p>
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
              <div className="p-1">
                <p className="text-gray-900 font-semibold text-sm px-2 py-2 w-full">
                  Member Organizations
                </p>
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
                              ? "bg-sky-100 text-gray-700"
                              : "text-gray-700"
                          } group flex w-full justify-between items-center rounded-md pl-4 pr-2 py-2 text-sm`}
                          onClick={() => {
                            orgContext?.setCurrentOrg(org.id);
                          }}
                        >
                          <div className="flex flex-row space-x-2 items-center">
                            {icon && (
                              <icon.icon className="h-4 w-4 text-gray-500" />
                            )}
                            <p className="w-32 text-left truncate">
                              {org.name}
                            </p>
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
            <Menu.Item>
              <div className="p-1">
                <button
                  onClick={() => setAddOpen(true)}
                  className={clsx(
                    "flex items-center space-x-2 text-gray-700 hover:bg-sky-100 rounded-md text-sm pl-4 py-2 w-full truncate"
                  )}
                >
                  <UserPlusIcon className="h-4 w-4 text-gray-500 mr-2" />
                  Invite Members
                </button>
                <button
                  onClick={() => {
                    if (
                      !(
                        userSettings?.tier === "pro" ||
                        userSettings?.tier === "enterprise"
                      ) &&
                      process.env.NEXT_PUBLIC_HELICONE_RESTRICT_PRO === "true"
                    ) {
                      setNotification(
                        "You must be on a paid plan to create an organization.",
                        "error"
                      );
                      return;
                    }
                    setCreateOpen(true);
                  }}
                  className={clsx(
                    "flex items-center text-gray-700 hover:bg-sky-100 rounded-md text-sm pl-4 py-2 w-full truncate"
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
                      "text-left block text-gray-700 hover:bg-red-100 rounded-md text-sm pl-3 py-2 w-full truncate"
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
      <ThemedModal open={addOpen} setOpen={setAddOpen}>
        <form
          action="#"
          method="POST"
          onSubmit={onSubmitHandler}
          className="flex flex-col gap-4 w-full"
        >
          <p className="font-semibold text-lg">Add New Member</p>
          <div className="space-y-1.5 text-sm w-[400px]">
            <label htmlFor="email">User Email</label>
            <input
              type="email"
              name="email"
              id="email"
              className={clsx(
                "block w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
              )}
              placeholder={"Enter user email"}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => {
                setAddOpen(false);
              }}
              className="flex flex-row items-center rounded-md bg-white px-4 py-2 text-sm font-semibold border border-gray-300 hover:bg-gray-50 text-gray-900 shadow-sm hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={() => {
                if (!org?.currentOrg) {
                  setNotification(
                    "Invalid organization. Please log out and try again",
                    "error"
                  );
                  return;
                }
              }}
              className="items-center rounded-md bg-black px-4 py-2 text-sm flex font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Add Member
            </button>
          </div>
        </form>
      </ThemedModal>
    </>
  );
}
