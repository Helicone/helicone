import { Helmet } from "react-helmet-async";
import { useParams } from "react-router";
import PortalIdPage from "./portalIdPage";

export default function PortalIdShell() {
  const { id } = useParams<{ id: string }>();

  return (
    <>
      <Helmet>
        <title>Customer Portal | Helicone</title>
      </Helmet>
      <PortalIdPage orgId={id || null} />
    </>
  );
}
