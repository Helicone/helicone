import { useContext } from "react";
import NotificationContext from "./NotificationContext";

const useNotification = () => useContext(NotificationContext);

export default useNotification;
