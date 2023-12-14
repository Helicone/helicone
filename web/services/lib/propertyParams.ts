import axios from "axios";
import { PropertyParam } from "../../lib/api/properties/propertyParams";
import { Result } from "../../lib/result";

/**
 * Retrieves the parameters for a given property based on the search query.
 * @param property - The name of the property.
 * @param search - The search query to filter the parameters.
 * @returns A promise that resolves to the result containing an array of PropertyParam objects or an error message.
 */
const getPropertyParams = async (property: string, search: string) => {
  const resp = await axios.get(
    `/api/properties/${property}/params?search=${search}`
  );
  return resp.data as Result<PropertyParam[], string>;
};

export { getPropertyParams };
