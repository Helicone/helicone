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
    <section className="w-full max-w-4xl mx-auto mt-6 mb-2">
      <div className="rounded-lg bg-sky-50 px-5 py-4 border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-600 my-1">{title}</h2>
        <p className="text-slate-500 text-md leading-relaxed mb-3">
          {description}
        </p>
        {children && <div className="mb-4">{children}</div>}
        <div className="flex flex-col sm:flex-row gap-4 my-1">
          <Button
            onClick={() => window.open(primaryButtonLink, "_blank")}
            className="inline-flex items-center justify-center p-6 rounded-md bg-sky-500 text-white font-medium hover:bg-sky-600 transition-colors text-md"
          >
            {primaryButtonText}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            onClick={() => window.open(secondaryButtonLink, "_blank")}
            className="inline-flex items-center justify-center p-6 rounded-md bg-white text-slate-600 font-medium border border-slate-200 hover:bg-slate-50 transition-colors text-md"
          >
            {secondaryButtonText}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
