import { NextPageWithLayout } from "../_app";
import AuthLayout from "../../components/layout/auth/authLayout";
import React, { ReactElement } from "react";
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
        <h2 className="mb-4 text-2xl font-bold">Developer Tools</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
    className="block rounded-lg bg-white p-6 shadow-md hover:bg-gray-50"
  >
    <div className="mb-2 flex items-center">
      <Icon className="mr-2 h-6 w-6 text-indigo-600" />
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
    <p className="text-gray-600">{description}</p>
  </Link>
);

export const ContactUsSection = ({ feature }: { feature: string }) => (
  <div className="flex h-96 w-full flex-col items-center justify-center">
    <div className="flex w-full flex-col">
      <GlobeAltIcon className="h-12 w-12 rounded-lg border border-gray-300 bg-white p-2 text-black dark:border-gray-700 dark:bg-black dark:text-white" />
      <p className="mt-8 text-xl font-semibold text-black dark:text-white">
        We&apos;d love to learn more about your use case
      </p>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        Please get in touch with us to discuss our {feature} feature.
      </p>
      <div className="mt-4">
        <Link
          href="https://cal.com/team/helicone/helicone-discovery"
          target="_blank"
          rel="noreferrer"
          className="flex w-fit items-center gap-2 rounded-lg bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
        >
          Contact Us
        </Link>
      </div>
    </div>
  </div>
);
