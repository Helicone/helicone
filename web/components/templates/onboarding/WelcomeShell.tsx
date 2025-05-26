import { useOrg } from "@/components/layout/org/organizationContext";
import LoadingAnimation from "@/components/shared/loadingAnimation";
import { useEffect } from "react";
import { useNavigate } from "react-router";

const Welcome = () => {
  const org = useOrg();
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/onboarding");
  }, [org, navigate]);
  return <LoadingAnimation title="Just setting up your account..." />;
};

export default Welcome;
