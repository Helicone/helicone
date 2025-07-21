import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// cursor

interface CallToActionProps {
  title?: string;
  description?: string;
  primaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  children?: React.ReactNode;
}

export function CallToAction({
  title = "Ready to learn more?",
  description = "Join Helicone's community or contact us to learn more.",
  primaryButtonText = "Get Started for Free",
  primaryButtonLink = "/signup",
  secondaryButtonText = "Contact Us",
  secondaryButtonLink = "/contact",
  children,
}: CallToActionProps) {
  return (
    <section className="mx-auto mb-2 mt-6 w-full max-w-4xl">
      <div className="rounded-lg border border-slate-200 bg-sky-50 px-5 py-4">
        <h2 className="my-1 text-xl font-semibold text-slate-600">{title}</h2>
        <p className="text-md mb-3 leading-relaxed text-slate-500">
          {description}
        </p>
        {children && <div className="mb-4">{children}</div>}
        <div className="my-1 flex flex-col gap-4 sm:flex-row">
          <Button
            onClick={() => window.open(primaryButtonLink, "_blank")}
            className="text-md inline-flex items-center justify-center rounded-md bg-sky-500 p-6 font-medium text-white transition-colors hover:bg-sky-600"
          >
            {primaryButtonText}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            onClick={() => window.open(secondaryButtonLink, "_blank")}
            className="text-md inline-flex items-center justify-center rounded-md border border-slate-200 bg-white p-6 font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            {secondaryButtonText}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
