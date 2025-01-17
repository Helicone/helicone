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
}

export function CallToAction({
  title = "Ready to learn more?",
  description = "Join Helicone's community or contact us to learn more.",
  primaryButtonText = "Sign up for free",
  primaryButtonLink = "/signup",
  secondaryButtonText = "Contact us",
  secondaryButtonLink = "/contact",
}: CallToActionProps) {
  return (
    <section className="w-full max-w-4xl mx-auto mt-6 mb-2">
      <div className="rounded-lg bg-[#F2F9FC] px-6 py-4 border border-[#E3EFF3]">
        <h2 className="text-xl font-semibold text-slate-600 my-0">{title}</h2>
        <p className="text-[#6B8C9C] text-md leading-relaxed mb-6">
          {description}
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => window.open(primaryButtonLink, "_blank")}
            className="inline-flex items-center justify-center p-6 rounded-md bg-[#0DA5E8] text-white font-medium hover:bg-[#0C94D1] transition-colors text-md"
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
