import { PropertyParam } from "../../lib/api/properties/propertyParams";
import { Result } from "../../lib/result";

const getPropertyParams = async (property: string, search: string) => {
  const resp = await fetch(
    `/api/properties/${property}/params?search=${search}`
  );
  const data = await resp.json();
  return data as Result<PropertyParam[], string>;
};

export { getPropertyParams };
