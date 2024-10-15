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
  description,
  enabled,
  onClick,
}) => {
  const Logo = LOGOS[title as keyof typeof LOGOS];

  return (
    <Card className="flex flex-col h-[150px]">
      <CardHeader className="flex-grow">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            {Logo && <Logo className="w-[2rem] h-[2rem] mr-2" />}
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
          className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
        >
          {title === "OpenPipe" ? "Configure" : "Learn more"}
          <ArrowRightIcon className="ml-1 h-4 w-4" />
        </button>
      </CardFooter>
    </Card>
  );
};

export default IntegrationCard;
