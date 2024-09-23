import { NextPageWithLayout } from "../_app";
import AuthLayout from "../../components/layout/auth/authLayout";
import { ReactElement } from "react";
import DeveloperPage from "../../components/templates/developer/developerPage";
import Link from "next/link";
import {
  GlobeAltIcon,
  KeyIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

const Developer: NextPageWithLayout = () => {
  return (
    <DeveloperPage title="Developer">
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Developer Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DeveloperCard
            title="Keys"
            description="Manage your API keys"
            icon={KeyIcon}
            href="/developer/keys"
          />
          <DeveloperCard
            title="Webhooks"
            description="Set up and manage webhooks"
            icon={GlobeAltIcon}
            href="/developer/webhooks"
          />
          <DeveloperCard
            title="Vault"
            description="Securely store and manage sensitive data"
            icon={LockClosedIcon}
            href="/developer/vault"
          />
        </div>
      </div>
    </DeveloperPage>
  );
};

Developer.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Developer;

const DeveloperCard = ({
  title,
  description,
  icon: Icon,
  href,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  href: string;
}) => (
  <Link
    href={href}
    className="block p-6 bg-white rounded-lg shadow-md hover:bg-gray-50"
  >
    <div className="flex items-center mb-2">
      <Icon className="h-6 w-6 text-indigo-600 mr-2" />
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
    <p className="text-gray-600">{description}</p>
  </Link>
);

export const ContactUsSection = ({ feature }: { feature: string }) => (
  <div className="flex flex-col w-full h-96 justify-center items-center">
    <div className="flex flex-col w-full">
      <GlobeAltIcon className="h-12 w-12 text-black dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-2 rounded-lg" />
      <p className="text-xl text-black dark:text-white font-semibold mt-8">
        We&apos;d love to learn more about your use case
      </p>
      <p className="text-sm text-gray-500 max-w-sm mt-2">
        Please get in touch with us to discuss our {feature} feature.
      </p>
      <div className="mt-4">
        <Link
          href="https://cal.com/team/helicone/helicone-discovery"
          target="_blank"
          rel="noreferrer"
          className="w-fit items-center rounded-lg bg-black dark:bg-white px-2.5 py-1.5 gap-2 text-sm flex font-medium text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Contact Us
        </Link>
      </div>
    </div>
  </div>
);
