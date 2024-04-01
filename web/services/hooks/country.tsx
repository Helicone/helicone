import { useQuery } from "@tanstack/react-query";
import { TimeFilter } from "../../components/templates/dashboard/dashboardPage";
import { Result } from "../../lib/result";
import { CountryData } from "../lib/country";

const useCountries = (timeFilter: TimeFilter, limit: number) => {
  const { data: countries, isLoading } = useQuery({
    queryKey: ["countries", timeFilter],
    queryFn: async (query) => {
      return await fetch("/api/country", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: "all",
          offset: 0,
          limit,
          timeFilter,
        }),
      }).then((res) => res.json() as Promise<Result<CountryData[], string>>);
    },
    refetchOnWindowFocus: false,
  });

  return { countries, isLoading };
};

export { useCountries };
