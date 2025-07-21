import React from "react";

interface QuestionsProps {}

export function Questions({}: QuestionsProps) {
  return (
    <>
      <hr className="mx-auto w-full max-w-4xl border-t border-slate-200" />
      <section className="mx-auto mb-2 mt-6 w-full max-w-4xl">
        <h3 className="text-2xl font-bold text-gray-700">
          Questions or feedback?
        </h3>
        <p className="text-base text-gray-500">
          Are the information out of date? Please{" "}
          <a
            href="https://github.com/Helicone/helicone/issues"
            rel="noopener"
            target="_blank"
          >
            raise an issue
          </a>{" "}
          or{" "}
          <a
            href="https://www.helicone.ai/contact"
            rel="noopener"
            target="_blank"
          >
            contact us
          </a>
          , we&apos;d love to hear from you!
        </p>
      </section>
    </>
  );
}
