import React from "react";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { LOGOS } from "./connectionSVG";

interface IntegrationCardProps {
  title: string;
  description: string;
  enabled?: boolean;
  onClick: () => void;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({
  title,
  enabled,
  onClick,
}) => {
  const Logo = LOGOS[title as keyof typeof LOGOS];

  return (
    <Card className="flex h-[150px] flex-col">
      <CardHeader className="flex-grow">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center">
            {Logo && <Logo className="mr-2 h-[2rem] w-[2rem]" />}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          {enabled !== undefined && (
            <Switch
              id={`${title.toLowerCase()}-switch`}
              disabled={true}
              checked={enabled}
              className="data-[state=checked]:bg-green-500"
            />
          )}
        </div>
      </CardHeader>
      <CardFooter className="mt-auto">
        <button
          onClick={onClick}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          Configure
          <ArrowRightIcon className="ml-1 h-4 w-4" />
        </button>
      </CardFooter>
    </Card>
  );
};

export default IntegrationCard;
