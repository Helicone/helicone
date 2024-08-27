import React from "react";

import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { Card } from "@tremor/react";
import { ToggleButton } from "../../shared/themed/themedToggle";
import { Row } from "../../layout/common";

const ConnectionsPage: React.FC = () => {
  return (
    <div className="flex flex-col space-y-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-gray-500">
          Explore and connect with various integrations to enhance your Helicone
          experience.
        </p>
      </div>
      <h2 className="text-2xl font-semibold mb-4">Providers</h2>
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
        <IntegrationCard
          title="Diffy"
          description="Integrate with Diffy's powerful language models."
          href="/integrations/diffy"
        />
        {/* Add more IntegrationCard components for other integrations */}
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">
          Fine-Tuning Integrations
        </h2>

        {/* <Integrations /> */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <IntegrationCard
          title="OpenPipe"
          description="Integrate with Diffy's powerful language models."
          href="/integrations/diffy"
        />
      </div>
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">
          Automated Eval Integrations
        </h2>
        {/* <Integrations /> */}
      </div>
      <h2 className="text-2xl font-semibold mb-4">Destinations</h2>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <Row className="justify-between ">
            <h3 className="text-xl font-semibold mb-2">PostHog</h3>
            <ToggleButton onChange={() => {}} value={false} />
          </Row>
          <p className="text-gray-600 mb-4">
            PostHog is a platform for fine-tuning and evaluating models.
          </p>
          <Link
            href={""}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            configure
            <ArrowRightIcon className="ml-1 h-4 w-4" />
          </Link>
        </Card>

        <Card>
          <Row className="justify-between ">
            <h3 className="text-xl font-semibold mb-2">Datadog</h3>
            <ToggleButton onChange={() => {}} value={false} />
          </Row>
          <p className="text-gray-600 mb-4">
            PostHog is a platform for fine-tuning and evaluating models.
          </p>
          <Link
            href={""}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            configure
            <ArrowRightIcon className="ml-1 h-4 w-4" />
          </Link>
        </Card>
      </div>

      <h2 className="text-2xl font-semibold mb-4">Gateway</h2>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <Row className="justify-between ">
            <h3 className="text-xl font-semibold mb-2">Pillar</h3>
            <ToggleButton onChange={() => {}} value={false} />
          </Row>
          <p className="text-gray-600 mb-4">
            Pillar is a platform for fine-tuning and evaluating models.
          </p>
          <Link
            href={""}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            Learn more
            <ArrowRightIcon className="ml-1 h-4 w-4" />
          </Link>
        </Card>
        <Card>
          <Row className="justify-between ">
            <h3 className="text-xl font-semibold mb-2">NotDiamond</h3>
            <ToggleButton onChange={() => {}} value={false} />
          </Row>
          <p className="text-gray-600 mb-4">
            Pillar is a platform for fine-tuning and evaluating models.
          </p>
          <Link
            href={""}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            Learn more
            <ArrowRightIcon className="ml-1 h-4 w-4" />
          </Link>
        </Card>
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
    <Card>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <Link
        href={href}
        className="text-blue-600 hover:text-blue-800 flex items-center"
      >
        Learn more
        <ArrowRightIcon className="ml-1 h-4 w-4" />
      </Link>
    </Card>
  );
};

export default ConnectionsPage;
