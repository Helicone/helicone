import { createContext, ReactNode, useCallback, useMemo, useRef, useState } from "react";

const ALERT_TIME = 3000;
type NotificationVariants = "success" | "info" | "error";

const initialState: {
  variant: NotificationVariants;
  title: string;
} = {
  variant: "info",
  title: "",
};

const NotificationContext = createContext({
  ...initialState,
  setNotification: (
    _title: string,
    _variant: NotificationVariants,
  ) => {},
  clearNotification: () => {},
});

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = (props: NotificationProviderProps) => {
  const { children } = props;
  const [title, setTitle] = useState("");
  const [variant, setVariant] = useState<NotificationVariants>("success");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearNotification = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setTitle("");
    setVariant("success");
  }, []);

  const setNotification = useCallback((
    title: string,
    variant: NotificationVariants,
  ) => {
    setTitle(title);
    setVariant(variant);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setTitle("");
      setVariant("success");
      timeoutRef.current = null;
    }, ALERT_TIME);
  }, []);

  const contextValue = useMemo(
    () => ({
      title,
      variant,
      setNotification,
      clearNotification,
    }),
    [title, variant, setNotification, clearNotification],
  );

  return (
    <NotificationContext.Provider
      value={contextValue}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
