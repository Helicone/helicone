import { useJawnClient } from "@/lib/clients/jawnHook";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { testAPIKey } from "./first_page/useTestApiKey";

function generateUUID() {
  // Only use crypto.randomUUID() in browser environment
  if (typeof window !== "undefined") {
    return crypto.randomUUID();
  }
  // Return a placeholder value for server-side rendering
  return "SERVER_SIDE_UUID";
}

export const useCountDown = (seconds: number, onFinish: () => void) => {
  const [countDown, setCountDown] = useState(seconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountDown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return countDown;
};

export const useHeliconeLogin = (invalid_api_key?: boolean) => {
  const sessionUUID = useQuery({
    queryKey: ["sessionUUID"],
    queryFn: () => generateUUID(),
  });

  const countDown = useCountDown(600, () => {
    sessionUUID.refetch();
  });

  const jawn = useJawnClient();
  const apiKey = useQuery({
    queryKey: ["pi-session", sessionUUID.data],
    queryFn: async () => {
      if (invalid_api_key) {
        return null;
      }
      const cookie = Cookies.get("pi-api-key");

      if (cookie) {
        const test = await testAPIKey(cookie);

        if (test.data) {
          return cookie;
        }
      }
      if (!sessionUUID.data) {
        return null;
      }
      const apiKey = await jawn.POST("/v1/public/pi/get-api-key", {
        body: {
          sessionUUID: sessionUUID.data,
        },
      });

      if (apiKey.data?.error) {
        console.error(apiKey.data);
        alert(apiKey.data?.error ?? "Something went wrong");
        return null;
      }

      if (apiKey.data?.data?.apiKey) {
        Cookies.set("pi-api-key", apiKey.data?.data?.apiKey, {
          path: "/",
          expires: 1000 * 60 * 60 * 24 * 90, // 90 days
          sameSite: "strict",
        });
      }

      return apiKey.data?.data?.apiKey;
    },
    refetchInterval: 10_000, // 1 second
    staleTime: 0,
  });

  return {
    apiKey,
    sessionUUID: sessionUUID.data,
    countDown,
  };
};
