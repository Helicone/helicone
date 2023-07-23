import { createContext, ReactNode, useState } from "react";

const ALERT_TIME = 3000;
type NotificationVariants = "success" | "info" | "error";
type XPosition = "left" | "middle" | "right";
type YPosition = "top" | "middle" | "bottom";
interface Position {
  yPosition: YPosition;
  xPosition: XPosition;
}
const initialState: {
  variant: NotificationVariants;
  title: string;
  position: Position;
} = {
  variant: "info", //  variant?: "success" | "info" | "error";
  title: "",
  position: {
    yPosition: "top",
    xPosition: "middle",
  },
  // description: "",
};

const NotificationContext = createContext({
  ...initialState,
  setNotification: (
    title: string,
    // description: string,
    variant: NotificationVariants,
    position?: Position
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
  const [position, setPosition] = useState<Position>({
    yPosition: "top",
    xPosition: "middle",
  });

  const setNotification = (
    title: string,
    // description: string,
    variant: NotificationVariants,
    position?: Position
  ) => {
    setTitle(title);
    // setDescription(description);
    setVariant(variant);
    if (position) {
      setPosition(position);
    } else {
      setPosition({
        yPosition: "top",
        xPosition: "middle",
      });
    }
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
        position,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
