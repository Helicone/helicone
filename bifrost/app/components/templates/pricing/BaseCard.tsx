import React from "react";
import Link from "next/link";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/16/solid";

interface BaseCardProps {
  name: string;

  price: React.ReactNode;
  features: { name: string; included: boolean }[];
  ctaText: string;
  ctaLink: string;
  ctaClassName?: string;
  children?: React.ReactNode;
}

const BaseCard: React.FC<BaseCardProps> = ({
  name,

  price,
  features,
  ctaText,
  ctaLink,
  ctaClassName,
  children,
}) => {
  return (
    <div className="w-full h-full border border-gray-300 rounded-xl flex flex-col space-y-4 p-8 bg-white">
      <h2 className="text-sm font-semibold">{name}</h2>

      <div className="flex items-baseline space-x-1">{price}</div>
      {children}
      <ul className="text-gray-500 text-sm">
        {features.map((feature) => (
          <li key={feature.name} className="flex items-center gap-4 py-2">
            {feature.included ? (
              <CheckCircleIcon className="h-5 w-5 text-sky-500" />
            ) : (
              <XCircleIcon className="h-5 w-5 text-gray-300" />
            )}
            <span>{feature.name}</span>
          </li>
        ))}
      </ul>
      <Link
        href={ctaLink}
        className={
          ctaClassName ||
          "bg-white hover:bg-gray-100 ease-in-out duration-500 text-black border-[3px] border-gray-300 rounded-lg px-4 py-2 text-sm font-bold shadow-lg flex w-full justify-center text-center items-center gap-1"
        }
      >
        {ctaText}
      </Link>
    </div>
  );
};

export default BaseCard;
