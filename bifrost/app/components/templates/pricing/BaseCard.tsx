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
    <div className="flex h-full w-full flex-col space-y-4 rounded-xl border border-gray-300 bg-white p-8">
      <h2 className="text-sm font-semibold">{name}</h2>

      <div className="flex items-baseline space-x-1">{price}</div>
      {children}
      <ul className="text-sm text-gray-500">
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
          "flex w-full items-center justify-center gap-1 rounded-lg border-[3px] border-gray-300 bg-white px-4 py-2 text-center text-sm font-bold text-black shadow-lg duration-500 ease-in-out hover:bg-gray-100"
        }
      >
        {ctaText}
      </Link>
    </div>
  );
};

export default BaseCard;
