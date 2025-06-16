import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TriangleAlertIcon } from "lucide-react";

export const Deprecated = ({ feature }: { feature: string }) => {
  return (
    <div className="px-4 py-2">
      <Alert className="w-full">
        <TriangleAlertIcon className="h-4 w-4" />
        <AlertTitle className="font-semibold">Deprecation Notice</AlertTitle>
        <AlertDescription>
          We are deprecating the {feature} feature and it will be removed from
          the platform on{" "}
          <span className="font-semibold">September 1st, 2025</span>.
        </AlertDescription>
      </Alert>
    </div>
  );
};
