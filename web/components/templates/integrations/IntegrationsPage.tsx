import React from "react";

import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

const IntegrationsPage: React.FC = () => {
  return (
    <div className="flex flex-col space-y-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-gray-500">
          Explore and connect with various integrations to enhance your Helicone
          experience.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <IntegrationCard
          title="OpenAI"
          description="Integrate with OpenAI's powerful language models."
          href="/integrations/openai"
        />
        <IntegrationCard
          title="Anthropic"
          description="Connect with Anthropic's advanced AI models."
          href="/integrations/anthropic"
        />
        <IntegrationCard
          title="Azure"
          description="Leverage Azure's cloud-based AI services."
          href="/integrations/azure"
        />
        {/* Add more IntegrationCard components for other integrations */}
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Community Integrations</h2>
        {/* <Integrations /> */}
      </div>
    </div>
  );
};

interface IntegrationCardProps {
  title: string;
  description: string;
  href: string;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({
  title,
  description,
  href,
}) => {
  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <Link
        href={href}
        className="text-blue-600 hover:text-blue-800 flex items-center"
      >
        Learn more
        <ArrowRightIcon className="ml-1 h-4 w-4" />
      </Link>
    </div>
  );
};

export default IntegrationsPage;
