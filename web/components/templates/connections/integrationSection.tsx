import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import IntegrationCard from "./integrationCard";
import { Integration } from "./types";

interface IntegrationSectionProps {
  title: string;
  items: Integration[];
  onIntegrationClick: (title: string) => void;
}

const IntegrationSection: React.FC<IntegrationSectionProps> = ({
  title,
  items,
  onIntegrationClick,
}) => {
  if (items.length === 0) return null;

  return (
    <>
      <h2 className="text-2xl font-semibold mb-4">{title}</h2>
      <Carousel>
        <CarouselContent className="gap-4">
          {items.map((item, index) => (
            <CarouselItem key={index} className="basis-[55%] lg:basis-[30%]">
              <IntegrationCard
                title={item.title}
                description={`Integrate with ${item.title}'s services.`}
                enabled={item.enabled}
                onClick={() => onIntegrationClick(item.title)}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        {items.length >= 3 && (
          <>
            <CarouselPrevious />
            <CarouselNext />
          </>
        )}
      </Carousel>
    </>
  );
};

export default IntegrationSection;
