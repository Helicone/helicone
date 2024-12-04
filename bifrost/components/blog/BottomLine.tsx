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
      <div className="rounded-lg bg-[#F2F9FC] px-6 py-4 border border-[#E3EFF3]">
        <h2 className="text-lg font-semibold text-slate-600 my-0">{title}</h2>
        <p className="text-[#6B8C9C] text-md my-1">{description}</p>
      </div>
    </section>
  );
}
