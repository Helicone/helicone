import React from "react";

import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

import { ToggleButton } from "../../shared/themed/themedToggle";
import { Row } from "../../layout/common";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LOGOS } from "./connectionSVG";

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
      <Carousel>
        <CarouselContent className="gap-4">
          <CarouselItem className="basis-[30%]">
            <IntegrationCard
              title="OpenAI"
              Logo={LOGOS.OpenAI}
              description="Integrate with OpenAI's powerful language models."
              href="/integrations/openai"
            />
          </CarouselItem>
          <CarouselItem className="basis-[30%]">
            <IntegrationCard
              title="Anthropic"
              Logo={LOGOS.Anthropic}
              description="Connect with Anthropic's advanced AI models."
              href="/integrations/anthropic"
            />
          </CarouselItem>
          <CarouselItem className="basis-[30%]">
            <IntegrationCard
              title="Together AI"
              Logo={() => (
                <LOGOS.TogetherAI className="w-[80px] h-[24px] py-[4px]" />
              )}
              description="Access Together AI's collaborative AI platform."
              href="/integrations/together-ai"
            />
          </CarouselItem>
          <CarouselItem className="basis-[30%]">
            <IntegrationCard
              title="OpenRouter"
              Logo={LOGOS.OpenRouter}
              description="Route requests to various AI models with OpenRouter."
              href="/integrations/openrouter"
            />
          </CarouselItem>
          <CarouselItem className="basis-[30%]">
            <IntegrationCard
              title="Fireworks"
              Logo={LOGOS.Fireworks}
              description="Integrate with Fireworks AI solutions."
              href="/integrations/fireworks"
            />
          </CarouselItem>
          <CarouselItem className="basis-[30%]">
            <IntegrationCard
              title="Azure"
              Logo={LOGOS.Azure}
              description="Leverage Azure's cloud-based AI services."
              href="/integrations/azure"
            />
          </CarouselItem>
          <CarouselItem className="basis-[30%]">
            <IntegrationCard
              title="Groq"
              Logo={LOGOS.Groq}
              description="Access Groq's high-performance AI computing."
              href="/integrations/groq"
            />
          </CarouselItem>
          <CarouselItem className="basis-[30%]">
            <IntegrationCard
              title="Deepinfra"
              Logo={LOGOS.Deepinfra}
              description="Utilize Deepinfra's AI infrastructure solutions."
              href="/integrations/deepinfra"
            />
          </CarouselItem>
          <CarouselItem className="basis-[30%]">
            <IntegrationCard
              title="Anyscale"
              Logo={LOGOS.Anyscale}
              description="Scale your AI applications with Anyscale."
              href="/integrations/anyscale"
            />
          </CarouselItem>
          <CarouselItem className="basis-[30%]">
            <IntegrationCard
              title="Cloudflare"
              Logo={LOGOS.Cloudflare}
              description="Integrate with Cloudflare's AI gateway."
              href="/integrations/cloudflare"
            />
          </CarouselItem>
          <CarouselItem className="basis-[30%]">
            <IntegrationCard
              title="LemonFox"
              Logo={LOGOS.LemonFox}
              description="Connect with LemonFox AI services."
              href="/integrations/lemonfox"
            />
          </CarouselItem>
          <CarouselItem className="basis-[30%]">
            <IntegrationCard
              title="Perplexity"
              Logo={LOGOS.Perplexity}
              description="Integrate Perplexity's AI solutions."
              href="/integrations/perplexity"
            />
          </CarouselItem>
          <CarouselItem className="basis-[30%]">
            <IntegrationCard
              title="Mistral"
              Logo={LOGOS.Mistral}
              description="Access Mistral AI's advanced models."
              href="/integrations/mistral"
            />
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <IntegrationCard
          title="OpenAI"
          description="Integrate with OpenAI's powerful language models."
          Logo={LOGOS.OpenAI}
          href="/integrations/openai"
        />
        <IntegrationCard
          title="Anthropic"
          Logo={() => <LOGOS.Anthropic className="w-8 h-2" />}
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
  Logo?: React.FC<{ className: string }>;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({
  title,
  description,
  href,
  Logo,
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center ">
          {Logo && <Logo className="w-[2rem] h-[2rem]" />}
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Link
          href={href}
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          Learn more
          <ArrowRightIcon className="ml-1 h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ConnectionsPage;
