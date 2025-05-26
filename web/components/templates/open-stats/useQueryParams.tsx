import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

export const useQueryParams = () => {
  const navigate = useNavigate();
  const [queryParams, setQueryParamsState] = useState<{
    models: string[] | "none";
    provider: string;
    timeSpan: string;
    tab: number;
  }>({
    models: [],
    provider: "all",
    timeSpan: "1m",
    tab: 0,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setQueryParamsState({
        models: params.get("models")?.split(",") || [],
        provider: params.get("provider") || "all",
        timeSpan: params.get("timeSpan") || "1m",
        tab: parseInt(params.get("tab") || "0"),
      });
    }
  }, []);

  const setQueryParams = (params: {
    models: string[] | "none";
    provider: string;
    timeSpan: string;
    tab: number;
  }) => {
    const newParams = new URLSearchParams();
    if (params.models !== "none") {
      newParams.set("models", params.models.join(","));
    } else {
      newParams.set("models", "none");
    }
    if (params.provider) newParams.set("provider", params.provider);
    if (params.timeSpan) newParams.set("timeSpan", params.timeSpan);
    if (params.tab) newParams.set("tab", params.tab.toString());
    navigate(`?${newParams.toString()}`);
    setQueryParamsState(params);
  };

  return { queryParams, setQueryParams };
};
