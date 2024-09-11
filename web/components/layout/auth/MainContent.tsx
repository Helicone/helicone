import { Menu, Transition } from "@headlessui/react";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { Fragment } from "react";
import { Database } from "../../../supabase/database.types";
import { clsx } from "../../shared/clsx";
import ThemedDropdown from "../../shared/themed/themedDropdown";
import { getUSDate, signOut } from "../../shared/utils/utils";
import OrgContext, { useOrg } from "../organizationContext";

interface MainContentProps {
  children: React.ReactNode;
  banner: any; // Replace 'any' with the correct type for your banner
  pathname: string;
}

const MainContent = ({ children, banner, pathname }: MainContentProps) => {
  const router = useRouter();
  const supabaseClient = useSupabaseClient<Database>();
  const user = useUser();
  const org = useOrg();

  return (
    <div className={clsx("flex flex-1 flex-col md:pl-56")}>
      <div className="sticky top-0 z-20 h-16 flex md:hidden flex-shrink-0 bg-white dark:bg-black border-b border-gray-300 dark:border-gray-700">
        <div className="flex flex-1 justify-end px-4">
          <div className="ml-4 flex items-center md:ml-6">
            <div className="flex md:hidden">
              {org && (
                <ThemedDropdown
                  selectedValue={org.currentOrg?.id}
                  options={org.allOrgs.map((org) => {
                    if (org.owner === user?.id) {
                      return {
                        label: org.name + " (Owner)",
                        value: org.id,
                      };
                    } else {
                      return {
                        label: org.name,
                        value: org.id,
                      };
                    }
                  })}
                  onSelect={(value) => {
                    if (value) {
                      org.setCurrentOrg(value);
                    }
                  }}
                  align="right"
                />
              )}
            </div>

            {/* Profile dropdown */}
            <Menu as="div" className="relative ml-6">
              <div className="flex flex-row gap-4 items-center">
                <Menu.Button className="px-2.5 py-0.5 text-lg font-light bg-black text-white rounded-full flex items-center justify-center focus:ring-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2">
                  <span className="sr-only">Open user menu</span>
                  {user?.email?.charAt(0).toUpperCase() || (
                    <UserCircleIcon className="h-8 w-8 text-black" />
                  )}
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
                <Menu.Items className="absolute right-0 z-40 mt-2 w-56 origin-top-right rounded-md bg-white py-1 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <Menu.Item key="user-email">
                    {({ active }) => (
                      <p className="truncate block px-4 py-2 text-sm text-black font-bold border-b border-gray-300">
                        {user?.email}
                      </p>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={clsx(
                          active ? "bg-gray-100" : "",
                          "flex w-full px-4 py-2 text-sm text-gray-500 border-t border-gray-300"
                        )}
                        onClick={async () => {
                          signOut(supabaseClient).then(() => {
                            router.push("/");
                          });
                        }}
                      >
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
      <main className="flex-1">
        {banner && (
          <div className="p-2">
            <div className="w-full bg-sky-500 rounded-lg p-2 text-white flex items-center justify-center gap-2">
              <span className="text-sky-100 text-xs font-normal">
                {getUSDate(new Date(banner.updated_at))}
              </span>
              <p className="text-sky-100 font-normal">|</p>
              <p className="text-sm font-semibold"> {banner.title}</p>
              <svg
                viewBox="0 0 2 2"
                className="inline h-0.5 w-0.5 fill-current"
                aria-hidden="true"
              >
                <circle cx={1} cy={1} r={1} />
              </svg>
              <p className="text-sm text-gray-100">{banner.message}</p>
            </div>
          </div>
        )}
        <div
          className={clsx(
            "mx-auto px-4 sm:px-8 bg-gray-100 dark:bg-[#17191d] h-full min-h-screen"
          )}
        >
          <OrgContext.Provider value={org}>
            <div
              className="py-4 sm:py-8 mr-auto w-full max-w-[100rem]"
              key={`${pathname}-${org?.renderKey}`}
            >
              {children}
            </div>
          </OrgContext.Provider>
        </div>
      </main>
    </div>
  );
};

export default MainContent;
