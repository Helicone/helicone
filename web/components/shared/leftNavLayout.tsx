import { Dialog, Transition } from "@headlessui/react";
import {
  Bars3Icon,
  CalendarIcon,
  ChartBarIcon,
  FolderIcon,
  HomeIcon,
  InboxIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { useRouter } from "next/router";
import { Fragment, ReactNode, useState } from "react";
import { clsx } from "./clsx";

interface LeftNavLayoutProps {
  children: ReactNode;
}

const LeftNavLayout = (props: LeftNavLayoutProps) => {
  const { children } = props;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const router = useRouter();

  const { pathname } = router;

  const leftPaths = [
    // {
    //   name: "View Account",
    //   path: "/settings/account",
    //   active: pathname === "/settings/account",
    // },
    {
      name: "Dashboard",
      path: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      name: "Manage Keys",
      path: "/settings/keys",
      active: pathname === "/settings/keys",
    },
    // {
    //   name: "View Pricing",
    //   path: "/settings/pricing",
    //   active: pathname === "/settings/pricing",
    // },
  ];

  return (
    <div className="flex flex-row h-full w-screen">
      {/* Sidebar */}
      <div className="h-full flex min-w-64 flex-col">
        <nav className="py-2 pl-4 pr-2 flex-1 space-y-1 bg-white w-64 border-r-[1px] border-gray-200">
          {leftPaths.map((item) => (
            <a
              key={item.name}
              href={item.path}
              className={clsx(
                item.active
                  ? "bg-gray-200 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                "group flex items-center px-2 py-2 text-sm font-medium rounded-md"
              )}
            >
              {/* <item.icon
                className={clsx(
                  item.current
                    ? "text-gray-500"
                    : "text-gray-400 group-hover:text-gray-500",
                  "mr-3 flex-shrink-0 h-6 w-6"
                )}
                aria-hidden="true"
              /> */}
              {item.name}
            </a>
          ))}
        </nav>
      </div>
      <div className="h-full flex flex-col p-4 w-full bg-gray-50">
        {children}
      </div>
      {/*  */}
    </div>
  );
};

export default LeftNavLayout;
