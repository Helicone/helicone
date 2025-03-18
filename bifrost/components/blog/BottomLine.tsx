import React from "react";
import { H2, P } from "@/components/ui/typography";

interface BottomLineProps {
  title?: string;
  description?: string;
}

export function BottomLine({
  title = "Ready to learn more?",
  description = "Join Helicone's community or contact us to learn more.",
}: BottomLineProps) {
  return (
    <section className="w-full max-w-4xl mx-auto mt-6 mb-2">
      <div className="flex flex-col gap-2 rounded-lg bg-sky-50 px-5 pt-4 pb-2 border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-600 my-1">{title}</h2>
        <p className="text-slate-500 text-md leading-relaxed">{description}</p>
      </div>
    </section>
  );
}
