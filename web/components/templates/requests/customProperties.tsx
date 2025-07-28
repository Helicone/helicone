import React from "react";

interface CustomPropertiesProps {
  customProperties: { [key: string]: string };
  properties: string[];
}

export const CustomProperties: React.FC<CustomPropertiesProps> = ({
  customProperties,
  properties,
}) => {
  return (
    <>
      {properties.map((property, i) => {
        if (customProperties && customProperties.hasOwnProperty(property)) {
          return (
            <p className="text-sm" key={i}>
              <span className="font-semibold">{property}:</span>{" "}
              {customProperties[property] as string}
            </p>
          );
        }
      })}
    </>
  );
};

export const CustomPropertiesCard: React.FC<CustomPropertiesProps> = ({
  customProperties,
  properties,
}) => {
  return (
    <>
      <div className="flex flex-wrap items-center gap-4 pt-2 text-sm">
        {properties.map((property, i) => {
          if (customProperties && customProperties.hasOwnProperty(property)) {
            return (
              <li
                className="flex min-w-[5rem] flex-col justify-between space-y-1 rounded-lg border border-gray-300 p-2.5 text-left shadow-sm dark:border-gray-700"
                key={i}
              >
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {property}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  {customProperties[property] as string}
                </p>
              </li>
            );
          }
        })}
      </div>
    </>
  );
};
