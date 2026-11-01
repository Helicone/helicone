import { useJawnClient } from "@/lib/clients/jawnHook";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cookies from "js-cookie";
import { testAPIKey } from "./first_page/useTestApiKey";

export const useCountDown = (seconds: number, onFinish: () => void) => {
  const [countDown, setCountDown] = useState(seconds);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  });

  useEffect(() => {
    if (seconds <= 0) {
      return;
    }
    if (countDown <= 0) {
      onFinishRef.current();
      // Do not reset here: the countdown only restarts via `reset` once a
      // fresh value (e.g. a rotated session UUID) actually arrives, so the
      // timer never misrepresents the expiry of a stale session.
      return;
    }
    const timeout = setTimeout(() => {
      setCountDown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [countDown, seconds]);

  const reset = useCallback(() => {
    setCountDown(seconds);
  }, [seconds]);

  return { countDown, reset };
};

export const useHeliconeLogin = (invalid_api_key?: boolean) => {
  const jawn = useJawnClient();
  // Session ids are issued by the server; they are never chosen client-side.
  const sessionUUID = useQuery({
    queryKey: ["sessionUUID"],
    queryFn: async () => {
      if (typeof window === "undefined") {
        return null;
      }
      const res = await jawn.POST("/v1/public/pi/session", {});
      return res.data?.data?.sessionUUID ?? null;
    },
    staleTime: 9 * 60 * 1000,
  });

  const { countDown, reset: resetCountDown } = useCountDown(600, () => {
    sessionUUID.refetch();
  });

  useEffect(() => {
    // Restart the countdown only when a new session UUID is actually issued.
    // A failed refetch resolves to null (the queryFn returns null instead of
    // throwing, so React Query treats it as successful data); resetting on
    // null would show a fresh countdown for an invalid link.
    if (sessionUUID.data) {
      resetCountDown();
    }
  }, [sessionUUID.data, resetCountDown]);

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
