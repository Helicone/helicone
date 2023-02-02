import { ReactNode } from "react";
import { clsx } from "../clsx";
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
        return "bg-gradient-to-r from-sky-200 to-purple-200";
      case "secondary":
        return "bg-white";
      default:
        return "bg-gray-200";
    }
  };

  // bg-gradient-to-r from-cyan-300 to-blue-300
  return (
    <div
      className={clsx(
        "px-4 sm:px-8 flex flex-col h-screen w-screen",
        variantTheme()
      )}
      // style={{
      //   backgroundImage: variant === "primary" ? "url(/assets/dev.jpg" : "",
      // }}
    >
      <NavBar />
      <div className="h-full">{children}</div>
    </div>
  );
};

export default BasePage;
