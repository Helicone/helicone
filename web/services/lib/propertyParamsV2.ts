import { PropertyParam } from "../../lib/api/properties/propertyParams";
import { Result } from "../../lib/result";

const getPropertyParamsV2 = async (property: string, search: string) => {
  const resp = await fetch(
    `/api/propertiesV2/${property}/params?search=${search}`
  );
  const data = await resp.json();
  return data as Result<PropertyParam[], string>;
};

export { getPropertyParamsV2 };
