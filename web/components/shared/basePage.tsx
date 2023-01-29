import { ReactNode } from "react";
import { clsx } from "./clsx";
import NavBar from "./navBar";

interface BasePageProps {
  children: ReactNode;
  variant?: "primary" | "secondary";
}

const BasePage = (props: BasePageProps) => {
  const { children, variant = "primary" } = props;

  const variantTheme = () => {
    switch (variant) {
      case "primary":
        return "bg-gray-300 sm:px-8";
      case "secondary":
        return "bg-white sm:px-0";
      default:
        return "bg-gray-300";
    }
  };

  return (
    <div
      className={clsx("px-4 flex flex-col h-screen w-screen", variantTheme())}
    >
      <NavBar variant={variant} />
      <div className="h-full">{children}</div>
    </div>
  );
};

export default BasePage;
