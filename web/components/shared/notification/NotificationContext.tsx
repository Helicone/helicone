import {
  createContext,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

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
  setNotification: (_title: string, _variant: NotificationVariants) => {},
  clearNotification: () => {},
});

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = (props: NotificationProviderProps) => {
  const { children } = props;
  const [title, setTitle] = useState("");
  const [variant, setVariant] = useState<NotificationVariants>("success");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearNotification = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setTitle("");
    setVariant("info");
  }, []);

  const setNotification = useCallback(
    (title: string, variant: NotificationVariants) => {
      setTitle(title);
      setVariant(variant);

      clearTimeout(timeoutRef.current!);
      timeoutRef.current = setTimeout(() => {
        clearNotification();
      }, ALERT_TIME);
    },
    [clearNotification],
  );

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
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
