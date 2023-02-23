import { useState } from "react";
import ThemedModal from "../themed/themedModal";
import Login from "./login";

interface LoginButtonProps {
  onClick?: () => void;
}

const LoginButton = (props: LoginButtonProps) => {
  const { onClick } = props;
  const [openLogin, setOpenLogin] = useState(false);

  const handleClick = () => {
    setOpenLogin(true);
    onClick && onClick();
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="whitespace-nowrap text-base font-medium text-gray-500 hover:text-gray-900 mr-8"
      >
        Sign in
      </button>

      <ThemedModal open={openLogin} setOpen={setOpenLogin}>
        <Login />
      </ThemedModal>
    </>
  );
};

export default LoginButton;
