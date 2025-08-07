import { ReactElement } from "react";
import AuthLayout from "../components/layout/auth/authLayout";
import VaultPage from "../components/templates/vault/vaultPage";

const Vault = () => {
  return <VaultPage />;
};

Vault.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Vault;
