import { Helmet } from "react-helmet-async";
import PortalPage from "./portalPage";

export default function PortalShell() {
  return (
    <>
      <Helmet>
        <title>Enterprise Portal | Helicone</title>
      </Helmet>
      <PortalPage />
    </>
  );
}
