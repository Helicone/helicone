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
        className="rounded-xl border border-gray-900 px-4 py-2 font-semibold text-gray-900"
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
