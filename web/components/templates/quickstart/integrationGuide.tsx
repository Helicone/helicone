import { IntegrationCodeTabs } from "@/components/shared/IntegrationCodeTabs";
import { BookOpen } from "lucide-react";
import Link from "next/link";

interface IntegrationGuideProps {
  apiKey?: string;
}

const IntegrationGuide = ({ apiKey }: IntegrationGuideProps) => {
  return (
    <div
      className="w-full rounded-lg bg-background"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col gap-4 px-4 py-2">
        <IntegrationCodeTabs apiKey={apiKey} />

        <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50/50 px-3 py-2 dark:border-blue-800 dark:bg-blue-950/20">
          <BookOpen className="h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
          <span className="text-sm text-blue-900 dark:text-blue-100">
            Check our{" "}
            <Link
              href="/models"
              className="font-medium underline underline-offset-2 hover:no-underline"
            >
              Model Registry
            </Link>{" "}
            to see all supported model slugs for the AI Gateway
          </span>
        </div>
      </div>
    </div>
  );
};

export default IntegrationGuide;
