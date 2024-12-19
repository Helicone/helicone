import { useJawnClient } from "@/lib/clients/jawnHook";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";
import Cookies from "js-cookie";

function generateUUID() {
  // Only use crypto.randomUUID() in browser environment
  if (typeof window !== "undefined") {
    return crypto.randomUUID();
  }
  // Return a placeholder value for server-side rendering
  return "SERVER_SIDE_UUID";
}

export const useHeliconeLogin = (invalid_api_key?: boolean) => {
  const getSessionUUID = useCallback(() => {
    const cookie = Cookies.get("sessionUUID");
    console.log("cookie", cookie);
    if (cookie && !invalid_api_key) {
      return cookie;
    } else {
      const newUUID = generateUUID();
      Cookies.set("sessionUUID", newUUID, {
        path: "/",
        expires: 1000 * 60 * 60, // 1 hour
        sameSite: "strict",
      });
      return newUUID;
    }
  }, []);

  const sessionUUID = useQuery({
    queryKey: ["sessionUUID"],
    queryFn: () => getSessionUUID(),
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
        return cookie;
      }
      if (!sessionUUID.data) {
        return null;
      }
      const apiKey = await jawn.POST("/v1/public/pi/get-api-key", {
        body: {
          sessionUUID: sessionUUID.data,
        },
      });

      if (apiKey.data?.error || !apiKey.data?.data?.apiKey) {
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
  });

  return {
    apiKey,
    sessionUUID: sessionUUID.data,
  };
};
