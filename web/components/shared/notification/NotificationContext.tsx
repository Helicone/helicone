import { createContext, ReactNode, useState } from "react";

const ALERT_TIME = 3500;
type NotificationVariants = "success" | "info" | "error";
type XPosition = "left" | "middle" | "right";
type YPosition = "top" | "middle" | "bottom";

const initialState: {
  variant: NotificationVariants;
  title: string;
} = {
  variant: "info", //  variant?: "success" | "info" | "error";
  title: "",

  // description: "",
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
  // const [description, setDescription] = useState("");
  const [variant, setVariant] = useState<NotificationVariants>("success");

  const setNotification = (
    title: string,
    // description: string,
    variant: NotificationVariants
  ) => {
    setTitle(title);
    // setDescription(description);
    setVariant(variant);

    setTimeout(() => {
      setTitle("");
      // setDescription("");
      setVariant("success");
    }, ALERT_TIME);
  };

  return (
    <NotificationContext.Provider
      value={{
        title,
        // description,
        variant,
        setNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
