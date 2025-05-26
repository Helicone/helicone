import { Helmet } from "react-helmet-async";
import DeveloperPage from "./developerPage";
import KeyPage from "../keys/keyPage";

export default function DeveloperKeysShell() {
  return (
    <>
      <Helmet>
        <title>Developer Keys | Helicone</title>
      </Helmet>
      <DeveloperPage title="Developer Keys">
        <KeyPage />
      </DeveloperPage>
    </>
  );
}
