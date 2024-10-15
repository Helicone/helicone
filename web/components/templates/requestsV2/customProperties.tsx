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
      <div className="flex flex-wrap gap-4 text-sm items-center pt-2">
        {properties.map((property, i) => {
          if (customProperties && customProperties.hasOwnProperty(property)) {
            return (
              <li
                className="flex flex-col space-y-1 justify-between text-left p-2.5 shadow-sm border border-gray-300 dark:border-gray-700 rounded-lg min-w-[5rem]"
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
