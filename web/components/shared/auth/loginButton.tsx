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
        className="px-4 py-2 border border-gray-900 font-semibold text-gray-900 rounded-xl"
      >
        Sign In
      </button>
      <ThemedModal open={openLogin} setOpen={setOpenLogin}>
        <Login formState="login" />
      </ThemedModal>
    </>
  );
};

export default LoginButton;
