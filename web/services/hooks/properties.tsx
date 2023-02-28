import { useQuery } from "@tanstack/react-query";
import { Property } from "../../lib/api/properties/properties";
import { getProperties } from "../lib/properties";

const useGetProperties = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      return getProperties().then((res) => res);
    },
    refetchOnWindowFocus: false,
  });

  console.log(data?.data);

  const allProperties: string[] = data?.data.map((property: Property) => {
    return property.property;
  });

  return { properties: allProperties || [], isLoading, error };
};

export { useGetProperties };
