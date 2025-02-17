import { useOrg } from "@/components/layout/org/organizationContext";
import LoadingAnimation from "@/components/shared/loadingAnimation";
import { useRouter } from "next/router";
import { useEffect } from "react";
// import "prismjs/themes/prism.css";
interface WelcomeProps {
  currentStep: number;
}

const Welcome = (props: WelcomeProps) => {
  const org = useOrg();
  const router = useRouter();

  useEffect(() => {
    if (org) {
      if (org.allOrgs.length > 0) {
        router.push("/dashboard");
      }
    }
  }, [org, router]);
  return <LoadingAnimation title="Just setting up your account..." />;
};

export default Welcome;
