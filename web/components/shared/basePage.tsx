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
        return "bg-gray-200 sm:px-8";
      case "secondary":
        return "bg-white sm:px-0";
      default:
        return "bg-gray-200";
    }
  };

  // bg-gradient-to-r from-cyan-300 to-blue-300
  return (
    <div
      className={clsx(
        "bg-gray-300 bg-blend-overlay bg-center bg-cover px-4 flex flex-col h-screen w-screen",
        variantTheme()
      )}
      style={{ backgroundImage: "url(/assets/dev.jpg" }}
    >
      <NavBar variant={variant} />
      <div className="h-full">{children}</div>
    </div>
  );
};

export default BasePage;
