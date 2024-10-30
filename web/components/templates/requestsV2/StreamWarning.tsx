import { useLocalStorage } from "@/services/hooks/localStorage";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import Link from "next/link";

interface StreamWarningProps {
  requestWithStreamUsage: boolean;
}

const StreamWarning: React.FC<StreamWarningProps> = ({
  requestWithStreamUsage,
}) => {
  const [isWarningHidden, setIsWarningHidden] = useLocalStorage(
    "isStreamWarningHiddenx",
    requestWithStreamUsage
  );

  if (!requestWithStreamUsage || isWarningHidden) {
    return null;
  }

  return (
    <Alert variant="default" className="max-w-[800px] mx-10">
      <div className="flex justify-between items-center">
        <AlertDescription className="text-muted-foreground">
          We are unable to calculate your cost accurately because the
          &apos;stream_usage&apos; option is not included in your message.
          Please refer to{" "}
          <Link
            href="https://docs.helicone.ai/use-cases/enable-stream-usage"
            className="font-medium underline underline-offset-4"
          >
            this documentation
          </Link>{" "}
          for more information.
        </AlertDescription>
        <Button
          onClick={() => setIsWarningHidden(true)}
          variant="ghost"
          size="icon"
          className="h-6 w-6 mx-5"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>
    </Alert>
  );
};

export default StreamWarning;
