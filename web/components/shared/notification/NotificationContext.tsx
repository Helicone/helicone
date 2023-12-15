import { createContext, ReactNode, useState } from "react";

const ALERT_TIME = 3000;
type NotificationVariants = "success" | "info" | "error";

const initialState: {
  variant: NotificationVariants;
  title: string;
} = {
  variant: "info", //  variant?: "success" | "info" | "error";
  title: "",
};

const NotificationContext = createContext({
  ...initialState,
  setNotification: (
    title: string,
    // description: string,
    variant: NotificationVariants
  ) => {},
});

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = (props: NotificationProviderProps) => {
  const { children } = props;
  const [title, setTitle] = useState("");
  const [variant, setVariant] = useState<NotificationVariants>("success");

  const setNotification = (
    title: string,
    // description: string,
    variant: NotificationVariants
  ) => {
    setTitle(title);
    setVariant(variant);

    setTimeout(() => {
      setTitle("");
      setVariant("success");
    }, ALERT_TIME);
  };

  return (
    <NotificationContext.Provider
      value={{
        title,
        variant,
        setNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
