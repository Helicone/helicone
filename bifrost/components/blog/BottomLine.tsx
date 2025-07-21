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
    <section className="mx-auto mb-2 mt-6 w-full max-w-4xl">
      <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-sky-50 px-5 pb-2 pt-4">
        <h2 className="my-1 text-xl font-semibold text-slate-600">{title}</h2>
        <p className="text-md leading-relaxed text-slate-500">{description}</p>
      </div>
    </section>
  );
}
