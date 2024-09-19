import {
  UserGroupIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  NoSymbolIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/router";
import AuthHeader from "../../shared/authHeader";

const tabs = [
  {
    id: "organization",
    title: "Organization",
    icon: BuildingOfficeIcon,
    href: "/settings/organization",
  },
  {
    id: "plan",
    title: "Plan",
    icon: CreditCardIcon,
    href: "/settings/plan",
  },
  {
    id: "members",
    title: "Members",
    icon: UserGroupIcon,
    href: "/settings/members",
  },
  {
    id: "rate-limits",
    title: "Rate-Limits",
    icon: NoSymbolIcon,
    href: "/settings/rate-limits",
  },
];

const SettingsPage = () => {
  const router = useRouter();
  const currentPath = router.pathname;

  return (
    <>
      <AuthHeader title="Settings" />
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`${
                currentPath === tab.href
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <tab.icon
                className={`${
                  currentPath === tab.href ? "text-indigo-500" : "text-gray-400"
                } -ml-0.5 mr-2 h-5 w-5 inline-block`}
                aria-hidden="true"
              />
              {tab.title}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
};

export default SettingsPage;
