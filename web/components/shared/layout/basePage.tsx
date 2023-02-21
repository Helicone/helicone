import { ReactNode } from "react";
import { clsx } from "../clsx";
import NavBar from "./navBar";

interface BasePageProps {
  children: ReactNode;
  full?: boolean;
  variant?: "primary" | "secondary";
}

const BasePage = (props: BasePageProps) => {
  const { children, full = false, variant = "primary" } = props;

  const variantTheme = () => {
    switch (variant) {
      case "primary":
        return "bg-gradient-to-r from-sky-200 to-purple-200";
      case "secondary":
        return "bg-white";
      default:
        return "bg-gray-200";
    }
  };

  const variantFull = () => {
    switch (full) {
      case true:
        return "h-full";
      case false:
        return "h-screen";
      default:
        return "h-full";
    }
  };

  // bg-gradient-to-r from-cyan-300 to-blue-300
  return (
    <div
      className={clsx(
        "px-4 sm:px-8 flex flex-col w-screen",
        variantTheme(),
        variantFull()
      )}
    >
      <NavBar />
      <div className="h-full">{children}</div>
    </div>
  );
};

export default BasePage;
