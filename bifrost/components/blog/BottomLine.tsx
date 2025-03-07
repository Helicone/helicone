import React from "react";

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
      <div className="rounded-lg bg-sky-50 px-5 py-4 border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-600 my-1">{title}</h2>
        <p className="text-slate-500 text-md leading-relaxed">{description}</p>
      </div>
    </section>
  );
}
