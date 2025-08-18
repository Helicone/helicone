import { useRouter } from "next/router";
import useNotification from "../components/shared/notification/useNotification";
import AuthForm from "../components/templates/auth/authForm";
import { useHeliconeAuthClient } from "@/packages/common/auth/client/AuthClientFactory";
import { logger } from "@/lib/telemetry/logger";
const ResetPassword = () => {
  const router = useRouter();
  const heliconeAuthClient = useHeliconeAuthClient();
  const { setNotification } = useNotification();

  return (
    <AuthForm
      handleEmailSubmit={async (email: string, password: string) => {
        const { error } = await heliconeAuthClient.updateUser({
          password: password,
        });

        if (error) {
          setNotification("Error updating user. Please try again.", "error");
          logger.error({ error }, "Error updating user");
          return;
        }
        setNotification("Success. Redirecting...", "success");
        router.push("/dashboard");
      }}
      authFormType={"reset-password"}
    />
  );
};

export default ResetPassword;
